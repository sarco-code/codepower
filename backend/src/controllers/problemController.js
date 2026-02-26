import { pool } from "../db/pool.js";
import { aggregateProblem } from "../utils/problem.js";

export async function listProblems(req, res) {
  const { rows } = await pool.query(
    `SELECT p.*,
            COUNT(s.id) FILTER (WHERE s.verdict = 'Accepted') AS accepted_count
     FROM problems p
     LEFT JOIN submissions s ON s.problem_id = p.id
     GROUP BY p.id
     ORDER BY p.difficulty ASC, p.id ASC`
  );

  return res.json({
    problems: rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      difficulty: row.difficulty,
      tags: row.tags || [],
      constraints: row.constraints,
      acceptedCount: Number(row.accepted_count || 0)
    }))
  });
}

export async function getProblem(req, res) {
  const { id } = req.params;
  const { rows } = await pool.query("SELECT * FROM problems WHERE id = $1", [id]);

  if (!rows[0]) {
    return res.status(404).json({ message: "Problem not found." });
  }

  const canViewHiddenTests = req.user?.role === "admin";
  const tests = await pool.query(
    `SELECT id, input, expected_output, is_sample, sample_type, sort_order
     FROM problem_test_cases
     WHERE problem_id = $1
       AND ($2::boolean = TRUE OR is_sample = TRUE)
     ORDER BY sort_order ASC, id ASC`,
    [id, canViewHiddenTests]
  );

  return res.json({ problem: aggregateProblem(rows[0], tests.rows) });
}

export async function createProblem(req, res) {
  const {
    slug,
    title,
    description,
    constraints,
    inputFormat,
    outputFormat,
    sampleInput,
    sampleOutput,
    explanation,
    difficulty,
    tags,
    testCases = []
  } = req.body;

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const insertedProblem = await client.query(
      `INSERT INTO problems
       (slug, title, description, constraints, input_format, output_format, sample_input, sample_output, explanation, difficulty, tags, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        slug,
        title,
        description,
        constraints,
        inputFormat,
        outputFormat,
        sampleInput,
        sampleOutput,
        explanation,
        difficulty,
        tags || [],
        req.user.id
      ]
    );

    const problem = insertedProblem.rows[0];

    for (let index = 0; index < testCases.length; index += 1) {
      const testCase = testCases[index];
      await client.query(
        `INSERT INTO problem_test_cases (problem_id, input, expected_output, is_sample, sample_type, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          problem.id,
          testCase.input,
          testCase.expectedOutput,
          Boolean(testCase.isSample),
          testCase.sampleType || "worked",
          index
        ]
      );
    }

    await client.query("COMMIT");

    const tests = await client.query(
      "SELECT id, input, expected_output, is_sample, sample_type, sort_order FROM problem_test_cases WHERE problem_id = $1 ORDER BY sort_order ASC, id ASC",
      [problem.id]
    );

    return res.status(201).json({ problem: aggregateProblem(problem, tests.rows) });
  } catch (error) {
    await client.query("ROLLBACK");
    return res.status(400).json({ message: error.message });
  } finally {
    client.release();
  }
}

export async function updateProblem(req, res) {
  const { id } = req.params;
  const {
    slug,
    title,
    description,
    constraints,
    inputFormat,
    outputFormat,
    sampleInput,
    sampleOutput,
    explanation,
    difficulty,
    tags,
    testCases = []
  } = req.body;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const updated = await client.query(
      `UPDATE problems
       SET slug = $1,
           title = $2,
           description = $3,
           constraints = $4,
           input_format = $5,
           output_format = $6,
           sample_input = $7,
           sample_output = $8,
           explanation = $9,
           difficulty = $10,
           tags = $11,
           updated_at = NOW()
       WHERE id = $12
       RETURNING *`,
      [
        slug,
        title,
        description,
        constraints,
        inputFormat,
        outputFormat,
        sampleInput,
        sampleOutput,
        explanation,
        difficulty,
        tags || [],
        id
      ]
    );

    if (!updated.rows[0]) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Problem not found." });
    }

    await client.query("DELETE FROM problem_test_cases WHERE problem_id = $1", [id]);

    for (let index = 0; index < testCases.length; index += 1) {
      const testCase = testCases[index];
      await client.query(
        `INSERT INTO problem_test_cases (problem_id, input, expected_output, is_sample, sample_type, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          id,
          testCase.input,
          testCase.expectedOutput,
          Boolean(testCase.isSample),
          testCase.sampleType || "worked",
          index
        ]
      );
    }

    await client.query("COMMIT");

    const tests = await client.query(
      "SELECT id, input, expected_output, is_sample, sample_type, sort_order FROM problem_test_cases WHERE problem_id = $1 ORDER BY sort_order ASC, id ASC",
      [id]
    );

    return res.json({ problem: aggregateProblem(updated.rows[0], tests.rows) });
  } catch (error) {
    await client.query("ROLLBACK");
    return res.status(400).json({ message: error.message });
  } finally {
    client.release();
  }
}

export async function deleteProblem(req, res) {
  const { id } = req.params;
  const result = await pool.query("DELETE FROM problems WHERE id = $1", [id]);

  if (!result.rowCount) {
    return res.status(404).json({ message: "Problem not found." });
  }

  return res.status(204).send();
}
