import bcrypt from "bcryptjs";
import { pool } from "../db/pool.js";
import { env } from "../config/env.js";
import { signToken } from "../utils/jwt.js";

async function ensureAdminUser() {
  const { rows } = await pool.query(
    "SELECT id, username, display_name, role, created_at FROM users WHERE username = $1",
    [env.adminUsername]
  );

  if (rows[0]) {
    if (rows[0].role !== "admin") {
      await pool.query("UPDATE users SET role = 'admin' WHERE id = $1", [rows[0].id]);
      rows[0].role = "admin";
    }
    return rows[0];
  }

  const passwordHash = await bcrypt.hash(env.adminPassword, 10);
  const inserted = await pool.query(
    `INSERT INTO users (username, display_name, email, password_hash, role)
     VALUES ($1, $2, $3, $4, 'admin')
     RETURNING id, username, display_name, role, created_at`,
    [env.adminUsername, env.adminDisplayName, "admin@sarcstar.local", passwordHash]
  );

  return inserted.rows[0];
}

export async function register(req, res) {
  const { username, email, password, displayName } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: "Username, email, and password are required." });
  }

  const existing = await pool.query(
    "SELECT id FROM users WHERE username = $1 OR email = $2",
    [username, email]
  );

  if (existing.rows[0]) {
    return res.status(409).json({ message: "Username or email already exists." });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const { rows } = await pool.query(
    `INSERT INTO users (username, email, display_name, password_hash, role)
     VALUES ($1, $2, $3, $4, 'user')
     RETURNING id, username, display_name, role, created_at`,
    [username, email, displayName || username, passwordHash]
  );

  const user = rows[0];
  const token = signToken(user);

  return res.status(201).json({ token, user });
}

export async function login(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required." });
  }

  if (username === env.adminUsername && password === env.adminPassword) {
    const adminUser = await ensureAdminUser();
    const token = signToken(adminUser);
    return res.json({ token, user: adminUser });
  }

  const { rows } = await pool.query(
    "SELECT id, username, display_name, role, password_hash, created_at FROM users WHERE username = $1",
    [username]
  );
  const user = rows[0];

  if (!user) {
    return res.status(401).json({ message: "Invalid credentials." });
  }

  const passwordMatches = await bcrypt.compare(password, user.password_hash);

  if (!passwordMatches) {
    return res.status(401).json({ message: "Invalid credentials." });
  }

  const token = signToken(user);

  return res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      display_name: user.display_name,
      role: user.role,
      created_at: user.created_at
    }
  });
}

export async function me(req, res) {
  return res.json({ user: req.user });
}
