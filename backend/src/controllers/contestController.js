import { pool } from "../db/pool.js";

function mapContest(row, problemRows = []) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    createdAt: row.created_at,
    problemCount: row.problem_count !== undefined ? Number(row.problem_count) : problemRows.length,
    problems: problemRows.map((problem) => ({
      id: problem.id,
      title: problem.title,
      difficulty: problem.difficulty,
      problemOrder: problem.problem_order
    }))
  };
}

export async function listContests(_req, res) {
  const { rows } = await pool.query(
    `SELECT c.id,
            c.title,
            c.description,
            c.starts_at,
            c.ends_at,
            c.created_at,
            COUNT(cp.problem_id) AS problem_count
     FROM contests c
     LEFT JOIN contest_problems cp ON cp.contest_id = c.id
     GROUP BY c.id
     ORDER BY c.starts_at ASC`
  );

  res.json({ contests: rows.map((row) => mapContest(row)) });
}

export async function getContest(req, res) {
  const { id } = req.params;
  const contestResult = await pool.query("SELECT * FROM contests WHERE id = $1", [id]);
  const contest = contestResult.rows[0];

  if (!contest) {
    return res.status(404).json({ message: "Contest not found." });
  }

  const problems = await pool.query(
    `SELECT p.id, p.title, p.difficulty, cp.problem_order
     FROM contest_problems cp
     JOIN problems p ON p.id = cp.problem_id
     WHERE cp.contest_id = $1
     ORDER BY cp.problem_order ASC, p.id ASC`,
    [id]
  );

  return res.json({ contest: mapContest(contest, problems.rows) });
}

export async function createContest(req, res) {
  const { title, description, startsAt, endsAt, problemIds = [] } = req.body;

  if (!title || !description || !startsAt || !endsAt) {
    return res.status(400).json({ message: "title, description, startsAt, and endsAt are required." });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const contestResult = await client.query(
      `INSERT INTO contests (title, description, starts_at, ends_at)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [title, description, startsAt, endsAt]
    );

    const contest = contestResult.rows[0];

    for (let index = 0; index < problemIds.length; index += 1) {
      await client.query(
        `INSERT INTO contest_problems (contest_id, problem_id, problem_order)
         VALUES ($1, $2, $3)`,
        [contest.id, problemIds[index], index]
      );
    }

    await client.query("COMMIT");

    const problems = await pool.query(
      `SELECT p.id, p.title, p.difficulty, cp.problem_order
       FROM contest_problems cp
       JOIN problems p ON p.id = cp.problem_id
       WHERE cp.contest_id = $1
       ORDER BY cp.problem_order ASC, p.id ASC`,
      [contest.id]
    );

    return res.status(201).json({ contest: mapContest(contest, problems.rows) });
  } catch (error) {
    await client.query("ROLLBACK");
    return res.status(400).json({ message: error.message });
  } finally {
    client.release();
  }
}

export async function updateContest(req, res) {
  const { id } = req.params;
  const { title, description, startsAt, endsAt, problemIds = [] } = req.body;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const updated = await client.query(
      `UPDATE contests
       SET title = $1, description = $2, starts_at = $3, ends_at = $4
       WHERE id = $5
       RETURNING *`,
      [title, description, startsAt, endsAt, id]
    );

    if (!updated.rows[0]) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "Contest not found." });
    }

    await client.query("DELETE FROM contest_problems WHERE contest_id = $1", [id]);

    for (let index = 0; index < problemIds.length; index += 1) {
      await client.query(
        `INSERT INTO contest_problems (contest_id, problem_id, problem_order)
         VALUES ($1, $2, $3)`,
        [id, problemIds[index], index]
      );
    }

    await client.query("COMMIT");

    const problems = await pool.query(
      `SELECT p.id, p.title, p.difficulty, cp.problem_order
       FROM contest_problems cp
       JOIN problems p ON p.id = cp.problem_id
       WHERE cp.contest_id = $1
       ORDER BY cp.problem_order ASC, p.id ASC`,
      [id]
    );

    return res.json({ contest: mapContest(updated.rows[0], problems.rows) });
  } catch (error) {
    await client.query("ROLLBACK");
    return res.status(400).json({ message: error.message });
  } finally {
    client.release();
  }
}

export async function deleteContest(req, res) {
  const { id } = req.params;
  const result = await pool.query("DELETE FROM contests WHERE id = $1", [id]);

  if (!result.rowCount) {
    return res.status(404).json({ message: "Contest not found." });
  }

  return res.status(204).send();
}
