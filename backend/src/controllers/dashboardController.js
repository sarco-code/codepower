import { pool } from "../db/pool.js";

export async function getDashboard(req, res) {
  const [statsResult, recentResult] = await Promise.all([
    pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE verdict = 'Accepted') AS solved,
         COUNT(*) AS total_submissions
       FROM submissions
       WHERE user_id = $1`,
      [req.user.id]
    ),
    pool.query(
      `SELECT s.id, s.verdict, s.execution_time_ms, s.memory_kb, s.created_at, p.title
       FROM submissions s
       JOIN problems p ON p.id = s.problem_id
       WHERE s.user_id = $1
       ORDER BY s.created_at DESC
       LIMIT 5`,
      [req.user.id]
    )
  ]);

  const solved = Number(statsResult.rows[0]?.solved || 0);
  const totalSubmissions = Number(statsResult.rows[0]?.total_submissions || 0);

  return res.json({
    stats: {
      solved,
      totalSubmissions,
      rank: Math.max(1, 500 - solved * 7),
      rating: 1200 + solved * 25
    },
    recentSubmissions: recentResult.rows
  });
}

export async function getUsersLeaderboard(_req, res) {
  const { rows } = await pool.query(
    `SELECT
       u.id,
       u.username,
       u.display_name,
       u.created_at,
       COUNT(s.id) FILTER (WHERE s.verdict = 'Accepted') AS solved,
       COUNT(s.id) AS total_submissions,
       MAX(s.created_at) AS last_submission_at
     FROM users u
     LEFT JOIN submissions s ON s.user_id = u.id
     GROUP BY u.id
     ORDER BY
       (1200 + COUNT(s.id) FILTER (WHERE s.verdict = 'Accepted') * 25) DESC,
       COUNT(s.id) FILTER (WHERE s.verdict = 'Accepted') DESC,
       COUNT(s.id) DESC,
       u.created_at ASC`
  );

  const users = rows.map((row, index) => {
    const solved = Number(row.solved || 0);
    const totalSubmissions = Number(row.total_submissions || 0);
    const rating = 1200 + solved * 25;

    return {
      id: row.id,
      username: row.username,
      displayName: row.display_name,
      joinedAt: row.created_at,
      solved,
      totalSubmissions,
      rating,
      platformRank: Math.max(1, 500 - solved * 7),
      leaderboardRank: index + 1,
      lastSubmissionAt: row.last_submission_at
    };
  });

  return res.json({ users });
}
