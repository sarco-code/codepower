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
