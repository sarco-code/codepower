import { pool } from "../db/pool.js";
import { runCode } from "../services/onlineCompiler.js";
import {
  getExecutionMetrics,
  getLanguageConfig,
  getResultOutput,
  mapExecutionVerdict,
  parseCallbackResult
} from "../utils/submission.js";

async function getPendingJobsCount(client, submissionId) {
  const result = await client.query(
    `SELECT COUNT(*)::int AS count
     FROM submission_judge_jobs
     WHERE submission_id = $1 AND status IN ('queued', 'processing')`,
    [submissionId]
  );
  return result.rows[0]?.count || 0;
}

async function finalizeSubmission(client, submissionId, verdict, timeMs, memoryKb) {
  await client.query(
    `UPDATE submissions
     SET verdict = $1, execution_time_ms = GREATEST(execution_time_ms, $2), memory_kb = GREATEST(memory_kb, $3)
     WHERE id = $4`,
    [verdict, timeMs, memoryKb, submissionId]
  );
}

async function cancelQueuedJobs(client, submissionId) {
  await client.query(
    `UPDATE submission_judge_jobs
     SET status = 'cancelled', finished_at = NOW()
     WHERE submission_id = $1 AND status = 'queued'`,
    [submissionId]
  );
}

async function markJobFailed(client, jobId, errorMessage) {
  await client.query(
    `UPDATE submission_judge_jobs
     SET status = 'failed', callback_payload = $2::jsonb, finished_at = NOW()
     WHERE id = $1`,
    [jobId, JSON.stringify({ error: errorMessage })]
  );
}

async function processNextQueuedJob() {
  const client = await pool.connect();
  let job = null;

  try {
    await client.query("BEGIN");
    const activeResult = await client.query(
      `SELECT id FROM submission_judge_jobs WHERE status = 'processing' LIMIT 1`
    );

    if (activeResult.rows.length) {
      await client.query("COMMIT");
      return;
    }

    const nextJobResult = await client.query(
      `SELECT id, submission_id, test_case_id, compiler, source_code, stdin
       FROM submission_judge_jobs
       WHERE status = 'queued'
       ORDER BY id ASC
       LIMIT 1
       FOR UPDATE SKIP LOCKED`
    );

    if (!nextJobResult.rows.length) {
      await client.query("COMMIT");
      return;
    }

    job = nextJobResult.rows[0];

    await client.query(
      `UPDATE submission_judge_jobs
       SET status = 'processing', started_at = NOW()
       WHERE id = $1`,
      [job.id]
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  try {
    const response = await runCode({
      sourceCode: job.source_code,
      compiler: job.compiler,
      stdin: job.stdin
    });

    console.log("OnlineCompiler queued response:", JSON.stringify(response));
  } catch (error) {
    console.error("Submission judge failure:", error);
    const failureClient = await pool.connect();

    try {
      await failureClient.query("BEGIN");
      await markJobFailed(failureClient, job.id, error.message);
      await pool.query(
        `INSERT INTO submission_test_results
         (submission_id, test_case_id, verdict, actual_output, expected_output, time_ms, memory_kb)
         SELECT $1, $2, 'Judge Error', $3, expected_output, 0, 0
         FROM problem_test_cases
         WHERE id = $2`,
        [job.submission_id, job.test_case_id, error.message]
      );
      await finalizeSubmission(failureClient, job.submission_id, "Judge Error", 0, 0);
      await cancelQueuedJobs(failureClient, job.submission_id);
      await failureClient.query("COMMIT");
    } catch (innerError) {
      await failureClient.query("ROLLBACK");
      console.error("Judge failure persistence error:", innerError);
    } finally {
      failureClient.release();
    }

    await processNextQueuedJob();
  }
}

export async function createSubmission(req, res) {
  const { problemId, language, sourceCode } = req.body;

  if (!problemId || !language || !sourceCode) {
    return res.status(400).json({ message: "problemId, language, and sourceCode are required." });
  }

  const problemResult = await pool.query("SELECT id FROM problems WHERE id = $1", [problemId]);
  if (!problemResult.rows[0]) {
    return res.status(404).json({ message: "Problem not found." });
  }

  const testsResult = await pool.query(
    "SELECT id, input, expected_output FROM problem_test_cases WHERE problem_id = $1 ORDER BY sort_order ASC, id ASC",
    [problemId]
  );

  if (!testsResult.rows.length) {
    return res.status(400).json({ message: "Problem has no test cases." });
  }

  const { compiler } = getLanguageConfig(language);
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const insertSubmission = await client.query(
      `INSERT INTO submissions (user_id, problem_id, language, source_code, verdict, execution_time_ms, memory_kb)
       VALUES ($1, $2, $3, $4, 'Running', 0, 0)
       RETURNING id, created_at`,
      [req.user.id, problemId, language, sourceCode]
    );

    const submission = insertSubmission.rows[0];

    for (const testCase of testsResult.rows) {
      await client.query(
        `INSERT INTO submission_judge_jobs
         (submission_id, test_case_id, compiler, source_code, stdin, expected_output, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'queued')`,
        [submission.id, testCase.id, compiler, sourceCode, testCase.input, testCase.expected_output]
      );
    }

    await client.query("COMMIT");

    const hydrated = await pool.query(
      `SELECT s.id,
              s.problem_id,
              s.language,
              s.verdict,
              s.execution_time_ms,
              s.memory_kb,
              s.created_at,
              p.title AS problem_title
       FROM submissions s
       JOIN problems p ON p.id = s.problem_id
       WHERE s.id = $1`,
      [submission.id]
    );

    processNextQueuedJob().catch((error) => {
      console.error("Judge queue dispatch failure:", error);
    });

    return res.status(201).json({ submission: hydrated.rows[0] });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function handleJudgeCallback(req, res) {
  const payload = req.body;
  console.log("OnlineCompiler callback payload:", JSON.stringify(payload));

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const jobResult = await client.query(
      `SELECT id, submission_id, test_case_id, expected_output
       FROM submission_judge_jobs
       WHERE status = 'processing'
       ORDER BY started_at ASC NULLS LAST, id ASC
       LIMIT 1
       FOR UPDATE SKIP LOCKED`
    );

    if (!jobResult.rows.length) {
      await client.query("COMMIT");
      return res.status(202).json({ ok: true, ignored: true });
    }

    const job = jobResult.rows[0];
    const result = parseCallbackResult(payload);
    const actualOutput = getResultOutput(result);
    const verdict = mapExecutionVerdict(result, job.expected_output);
    const { timeMs, memoryKb } = getExecutionMetrics(result);

    await client.query(
      `INSERT INTO submission_test_results
       (submission_id, test_case_id, verdict, actual_output, expected_output, time_ms, memory_kb)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [job.submission_id, job.test_case_id, verdict, actualOutput, job.expected_output, timeMs, memoryKb]
    );

    await client.query(
      `UPDATE submission_judge_jobs
       SET status = 'completed', callback_payload = $2::jsonb, actual_output = $3, verdict = $4, time_ms = $5, memory_kb = $6, finished_at = NOW()
       WHERE id = $1`,
      [job.id, JSON.stringify(payload), actualOutput, verdict, timeMs, memoryKb]
    );

    if (verdict !== "Accepted") {
      await finalizeSubmission(client, job.submission_id, verdict, timeMs, memoryKb);
      await cancelQueuedJobs(client, job.submission_id);
    } else {
      const pendingJobs = await getPendingJobsCount(client, job.submission_id);
      if (pendingJobs === 0) {
        await finalizeSubmission(client, job.submission_id, "Accepted", timeMs, memoryKb);
      }
    }

    await client.query("COMMIT");
    res.json({ ok: true });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Judge callback handling failure:", error);
    res.status(500).json({ message: "Judge callback processing failed." });
  } finally {
    client.release();
  }

  processNextQueuedJob().catch((error) => {
    console.error("Judge queue restart failure:", error);
  });
}

export async function listMySubmissions(req, res) {
  const { problemId } = req.query;
  const params = [req.user.id];
  let query = `
    SELECT s.id,
           s.problem_id,
           s.language,
           s.verdict,
           s.execution_time_ms,
           s.memory_kb,
           s.created_at,
           p.title AS problem_title
    FROM submissions s
    JOIN problems p ON p.id = s.problem_id
    WHERE s.user_id = $1
  `;

  if (problemId) {
    params.push(problemId);
    query += " AND s.problem_id = $2";
  }

  query += " ORDER BY s.created_at DESC LIMIT 50";

  const { rows } = await pool.query(query, params);
  return res.json({ submissions: rows });
}

export async function listAllSubmissions(req, res) {
  const { problemId, contestId, userId } = req.query;
  const params = [];
  const conditions = [];

  let query = `
    SELECT s.id,
           s.user_id,
           s.problem_id,
           s.language,
           s.verdict,
           s.execution_time_ms,
           s.memory_kb,
           s.created_at,
           p.title AS problem_title,
           u.username,
           u.display_name
    FROM submissions s
    JOIN problems p ON p.id = s.problem_id
    JOIN users u ON u.id = s.user_id
  `;

  if (contestId) {
    params.push(contestId);
    query += " JOIN contest_problems cp ON cp.problem_id = s.problem_id";
    conditions.push(`cp.contest_id = $${params.length}`);
  }

  if (problemId) {
    params.push(problemId);
    conditions.push(`s.problem_id = $${params.length}`);
  }

  if (userId) {
    params.push(userId);
    conditions.push(`s.user_id = $${params.length}`);
  }

  if (conditions.length) {
    query += ` WHERE ${conditions.join(" AND ")}`;
  }

  query += " ORDER BY s.created_at DESC LIMIT 200";

  const { rows } = await pool.query(query, params);
  return res.json({ submissions: rows });
}

export async function getSubmissionDetails(req, res) {
  const { id } = req.params;
  const submissionResult = await pool.query(
    `SELECT s.id,
            s.user_id,
            s.problem_id,
            s.language,
            s.source_code,
            s.verdict,
            s.execution_time_ms,
            s.memory_kb,
            s.created_at,
            p.title AS problem_title
     FROM submissions s
     JOIN problems p ON p.id = s.problem_id
     WHERE s.id = $1`,
    [id]
  );
  const submission = submissionResult.rows[0];

  if (!submission) {
    return res.status(404).json({ message: "Submission not found." });
  }

  if (submission.user_id !== req.user.id && req.user.role !== "admin") {
    return res.status(403).json({ message: "Insufficient permissions." });
  }

  const testResults = await pool.query(
    `SELECT id, test_case_id, verdict, actual_output, expected_output, time_ms, memory_kb
     FROM submission_test_results
     WHERE submission_id = $1
     ORDER BY id ASC`,
    [id]
  );

  return res.json({
    submission: {
      ...submission,
      testResults: testResults.rows
    }
  });
}
