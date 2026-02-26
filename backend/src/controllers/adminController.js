import bcrypt from "bcryptjs";
import { pool } from "../db/pool.js";

export async function listUsers(_req, res) {
  const { rows } = await pool.query(
    `SELECT id, username, email, display_name, role, created_at
     FROM users
     ORDER BY created_at DESC`
  );

  return res.json({ users: rows });
}

export async function createAdmin(req, res) {
  const { username, email, displayName, password } = req.body;

  if (!username || !email || !displayName || !password) {
    return res
      .status(400)
      .json({ message: "username, email, displayName, and password are required." });
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
     VALUES ($1, $2, $3, $4, 'admin')
     RETURNING id, username, email, display_name, role, created_at`,
    [username, email, displayName, passwordHash]
  );

  return res.status(201).json({ user: rows[0] });
}

export async function updateUserRole(req, res) {
  const { id } = req.params;
  const { role } = req.body;

  if (!["admin", "user"].includes(role)) {
    return res.status(400).json({ message: "Invalid role." });
  }

  const current = await pool.query(
    "SELECT id, username, email, display_name, role, created_at FROM users WHERE id = $1",
    [id]
  );

  if (!current.rows[0]) {
    return res.status(404).json({ message: "User not found." });
  }

  if (req.user.id === id && role !== "admin") {
    return res.status(400).json({ message: "You cannot remove your own admin role." });
  }

  const { rows } = await pool.query(
    `UPDATE users
     SET role = $1
     WHERE id = $2
     RETURNING id, username, email, display_name, role, created_at`,
    [role, id]
  );

  return res.json({ user: rows[0] });
}

export async function deleteUser(req, res) {
  const { id } = req.params;

  if (req.user.id === id) {
    return res.status(400).json({ message: "You cannot delete your own account." });
  }

  const existing = await pool.query(
    "SELECT id, username, role FROM users WHERE id = $1",
    [id]
  );

  if (!existing.rows[0]) {
    return res.status(404).json({ message: "User not found." });
  }

  if (existing.rows[0].username === "adminlogin") {
    return res.status(400).json({ message: "Primary admin account cannot be deleted." });
  }

  await pool.query("DELETE FROM users WHERE id = $1", [id]);
  return res.status(204).send();
}
