import { pool } from "../db/pool.js";
import { runCode } from "../services/onlineCompiler.js";
import { getLanguageConfig, mapExecutionVerdict } from "../utils/submission.js";

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

  const insertSubmission = await pool.query(
    `INSERT INTO submissions (user_id, problem_id, language, source_code, verdict, execution_time_ms, memory_kb)
     VALUES ($1, $2, $3, $4, 'Running', 0, 0)
     RETURNING id, created_at`,
    [req.user.id, problemId, language, sourceCode]
  );

  const submission = insertSubmission.rows[0];
  const { compiler } = getLanguageConfig(language);

  let finalVerdict = "Accepted";
  let maxTime = 0;
  let maxMemory = 0;
  let currentTestCaseId = null;

  try {
    for (const testCase of testsResult.rows) {
      currentTestCaseId = testCase.id;
      const result = await runCode({
        sourceCode,
        compiler,
        stdin: testCase.input
      });
      const actualOutput = result.output || result.error || "";

      const verdict = mapExecutionVerdict(
        result,
        actualOutput,
        testCase.expected_output
      );

      maxTime = Math.max(maxTime, Math.round(Number(result.time || 0) * 1000));
      maxMemory = Math.max(maxMemory, Number(result.memory || 0));

      await pool.query(
        `INSERT INTO submission_test_results
         (submission_id, test_case_id, verdict, actual_output, expected_output, time_ms, memory_kb)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          submission.id,
          testCase.id,
          verdict,
          actualOutput,
          testCase.expected_output,
          Math.round(Number(result.time || 0) * 1000),
          Number(result.memory || 0)
        ]
      );

      if (verdict !== "Accepted") {
        finalVerdict = verdict;
        break;
      }
    }
  } catch (error) {
    console.error("Submission judge failure:", error);
    finalVerdict = "Judge Error";

    if (currentTestCaseId) {
      await pool.query(
        `INSERT INTO submission_test_results
         (submission_id, test_case_id, verdict, actual_output, expected_output, time_ms, memory_kb)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          submission.id,
          currentTestCaseId,
          "Judge Error",
          error.message,
          "",
          0,
          0
        ]
      );
    }
  }

  await pool.query(
    `UPDATE submissions
     SET verdict = $1, execution_time_ms = $2, memory_kb = $3
     WHERE id = $4`,
    [finalVerdict, maxTime, maxMemory, submission.id]
  );

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

  return res.status(201).json({ submission: hydrated.rows[0] });
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
