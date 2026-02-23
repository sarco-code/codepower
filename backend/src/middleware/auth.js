import { verifyToken } from "../utils/jwt.js";
import { pool } from "../db/pool.js";

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing authorization token." });
  }

  try {
    const token = header.slice(7);
    const payload = verifyToken(token);
    const { rows } = await pool.query(
      "SELECT id, username, display_name, role, created_at FROM users WHERE id = $1",
      [payload.sub]
    );

    if (!rows[0]) {
      return res.status(401).json({ message: "User session is no longer valid." });
    }

    req.user = rows[0];
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid authorization token." });
  }
}

export async function optionalAuth(req, _res, next) {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return next();
  }

  try {
    const token = header.slice(7);
    const payload = verifyToken(token);
    const { rows } = await pool.query(
      "SELECT id, username, display_name, role, created_at FROM users WHERE id = $1",
      [payload.sub]
    );
    req.user = rows[0] || null;
  } catch (_error) {
    req.user = null;
  }

  return next();
}

export function requireRole(...roles) {
  return function roleMiddleware(req, res, next) {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Insufficient permissions." });
    }

    return next();
  };
}
