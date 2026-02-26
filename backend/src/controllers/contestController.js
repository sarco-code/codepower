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
    cheaterCount: row.cheater_count !== undefined ? Number(row.cheater_count) : 0,
    problems: problemRows.map((problem) => ({
      id: problem.id,
      title: problem.title,
      difficulty: problem.difficulty,
      problemOrder: problem.problem_order,
      points: Number(problem.points || 10)
    })),
    participants: row.participants || [],
    standings: row.standings || []
  };
}

function normalizeProblemEntries(problemEntries = [], problemIds = []) {
  if (problemEntries.length) {
    return problemEntries.map((entry, index) => ({
      problemId: Number(entry.problemId),
      points: Number(entry.points || 10),
      problemOrder: index
    }));
  }

  return problemIds.map((problemId, index) => ({
    problemId: Number(problemId),
    points: 10,
    problemOrder: index
  }));
}

function buildStandings(contest, problems, participants, submissions) {
  const contestStart = new Date(contest.starts_at).getTime();
  const problemLetters = new Map(problems.map((problem, index) => [problem.id, String.fromCharCode(65 + index)]));
  const participantMap = new Map();

  for (const participant of participants) {
    participantMap.set(participant.id, {
      userId: participant.id,
      username: participant.username,
      displayName: participant.display_name,
      status: participant.status || "active",
      notes: participant.notes || "",
      score: 0,
      acceptedCount: 0,
      submissionCount: 0,
      penaltyMinutes: 0,
      solvedAtMs: 0,
      perProblem: Object.fromEntries(
        problems.map((problem) => [
          problem.id,
          {
            letter: problemLetters.get(problem.id),
            points: Number(problem.points || 10),
            attempts: 0,
            solved: false,
            score: 0,
            penaltyMinutes: 0,
            solvedAt: null
          }
        ])
      )
    });
  }

  for (const submission of submissions) {
    if (!participantMap.has(submission.user_id)) {
      participantMap.set(submission.user_id, {
        userId: submission.user_id,
        username: submission.username,
        displayName: submission.display_name,
        status: "active",
        notes: "",
        score: 0,
        acceptedCount: 0,
        submissionCount: 0,
        penaltyMinutes: 0,
        solvedAtMs: 0,
        perProblem: Object.fromEntries(
          problems.map((problem) => [
            problem.id,
            {
              letter: problemLetters.get(problem.id),
              points: Number(problem.points || 10),
              attempts: 0,
              solved: false,
              score: 0,
              penaltyMinutes: 0,
              solvedAt: null
            }
          ])
        )
      });
    }

    const row = participantMap.get(submission.user_id);
    const cell = row.perProblem[submission.problem_id];
    if (!cell) continue;

    row.submissionCount += 1;
    cell.attempts += 1;

    if (cell.solved) continue;

    if (submission.verdict === "Accepted") {
      const solvedAt = new Date(submission.created_at).getTime();
      const penaltyMinutes = Math.max(0, Math.round((solvedAt - contestStart) / 60000));
      cell.solved = true;
      cell.score = cell.points;
      cell.penaltyMinutes = penaltyMinutes;
      cell.solvedAt = submission.created_at;
      row.score += cell.points;
      row.acceptedCount += 1;
      row.penaltyMinutes += penaltyMinutes;
      row.solvedAtMs = Math.max(row.solvedAtMs, solvedAt);
    }
  }

  return [...participantMap.values()]
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === "cheater" ? 1 : -1;
      if (b.score !== a.score) return b.score - a.score;
      if (a.penaltyMinutes !== b.penaltyMinutes) return a.penaltyMinutes - b.penaltyMinutes;
      return a.username.localeCompare(b.username);
    })
    .map((row, index) => ({
      ...row,
      rank: index + 1,
      perProblem: Object.values(row.perProblem)
    }));
}

function mergeParticipants(participants, submissions) {
  const merged = new Map(
    participants.map((participant) => [
      participant.id,
      {
        ...participant,
        status: participant.status || "active",
        notes: participant.notes || ""
      }
    ])
  );

  for (const submission of submissions) {
    if (merged.has(submission.user_id)) continue;
    merged.set(submission.user_id, {
      id: submission.user_id,
      username: submission.username,
      display_name: submission.display_name,
      status: "active",
      notes: ""
    });
  }

  return [...merged.values()].sort((a, b) => {
    if (a.status !== b.status) return a.status === "cheater" ? 1 : -1;
    return a.username.localeCompare(b.username);
  });
}

export async function listContests(_req, res) {
  const { rows } = await pool.query(
    `SELECT c.id,
            c.title,
            c.description,
            c.starts_at,
            c.ends_at,
            c.created_at,
            COUNT(DISTINCT cp.problem_id) AS problem_count,
            COUNT(DISTINCT ctp.user_id) FILTER (WHERE ctp.status = 'cheater') AS cheater_count
     FROM contests c
     LEFT JOIN contest_problems cp ON cp.contest_id = c.id
     LEFT JOIN contest_participants ctp ON ctp.contest_id = c.id
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

  const [problems, participants, submissions] = await Promise.all([
    pool.query(
      `SELECT p.id, p.title, p.difficulty, cp.problem_order, cp.points
       FROM contest_problems cp
       JOIN problems p ON p.id = cp.problem_id
       WHERE cp.contest_id = $1
       ORDER BY cp.problem_order ASC, p.id ASC`,
      [id]
    ),
    pool.query(
      `SELECT u.id, u.username, u.display_name, ctp.status, ctp.notes
       FROM contest_participants ctp
       JOIN users u ON u.id = ctp.user_id
       WHERE ctp.contest_id = $1
       ORDER BY ctp.updated_at DESC, u.username ASC`,
      [id]
    ),
    pool.query(
      `SELECT s.id, s.user_id, s.problem_id, s.verdict, s.created_at, u.username, u.display_name
       FROM submissions s
       JOIN contest_problems cp ON cp.problem_id = s.problem_id
       JOIN users u ON u.id = s.user_id
       WHERE cp.contest_id = $1
         AND s.created_at >= $2
         AND s.created_at <= $3
       ORDER BY s.created_at ASC, s.id ASC`,
      [id, contest.starts_at, contest.ends_at]
    )
  ]);

  const mergedParticipants = mergeParticipants(participants.rows, submissions.rows);
  const standings = buildStandings(contest, problems.rows, mergedParticipants, submissions.rows);

  return res.json({
    contest: {
      ...mapContest(contest, problems.rows),
      participants: mergedParticipants,
      standings
    }
  });
}

export async function createContest(req, res) {
  const { title, description, startsAt, endsAt, problemIds = [], problemEntries = [] } = req.body;

  if (!title || !description || !startsAt || !endsAt) {
    return res.status(400).json({ message: "title, description, startsAt, and endsAt are required." });
  }

  const entries = normalizeProblemEntries(problemEntries, problemIds);
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

    for (const entry of entries) {
      await client.query(
        `INSERT INTO contest_problems (contest_id, problem_id, points, problem_order)
         VALUES ($1, $2, $3, $4)`,
        [contest.id, entry.problemId, entry.points, entry.problemOrder]
      );
    }

    await client.query("COMMIT");

    const problems = await pool.query(
      `SELECT p.id, p.title, p.difficulty, cp.problem_order, cp.points
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
  const { title, description, startsAt, endsAt, problemIds = [], problemEntries = [] } = req.body;
  const entries = normalizeProblemEntries(problemEntries, problemIds);
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

    for (const entry of entries) {
      await client.query(
        `INSERT INTO contest_problems (contest_id, problem_id, points, problem_order)
         VALUES ($1, $2, $3, $4)`,
        [id, entry.problemId, entry.points, entry.problemOrder]
      );
    }

    await client.query("COMMIT");

    const problems = await pool.query(
      `SELECT p.id, p.title, p.difficulty, cp.problem_order, cp.points
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

export async function markContestParticipant(req, res) {
  const { id, userId } = req.params;
  const { status = "cheater", notes = "" } = req.body;

  if (!["active", "cheater"].includes(status)) {
    return res.status(400).json({ message: "Invalid participant status." });
  }

  const contest = await pool.query("SELECT id FROM contests WHERE id = $1", [id]);
  if (!contest.rows[0]) {
    return res.status(404).json({ message: "Contest not found." });
  }

  const user = await pool.query(
    "SELECT id, username, display_name FROM users WHERE id = $1",
    [userId]
  );
  if (!user.rows[0]) {
    return res.status(404).json({ message: "User not found." });
  }

  const { rows } = await pool.query(
    `INSERT INTO contest_participants (contest_id, user_id, status, notes, updated_at)
     VALUES ($1, $2, $3, $4, NOW())
     ON CONFLICT (contest_id, user_id)
     DO UPDATE SET status = EXCLUDED.status, notes = EXCLUDED.notes, updated_at = NOW()
     RETURNING contest_id, user_id, status, notes, updated_at`,
    [id, userId, status, notes]
  );

  return res.json({
    participant: {
      ...rows[0],
      username: user.rows[0].username,
      display_name: user.rows[0].display_name
    }
  });
}
