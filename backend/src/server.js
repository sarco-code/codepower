import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import authRoutes from "./routes/authRoutes.js";
import problemRoutes from "./routes/problemRoutes.js";
import submissionRoutes from "./routes/submissionRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import contestRoutes from "./routes/contestRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import judgeRoutes from "./routes/judgeRoutes.js";
import { pool } from "./db/pool.js";

const app = express();

app.use(
  cors({
    origin: env.clientUrl,
    credentials: true
  })
);
app.use(express.json({ limit: "1mb" }));

async function ensureJudgeQueueSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS submission_judge_jobs (
      id BIGSERIAL PRIMARY KEY,
      submission_id BIGINT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
      test_case_id BIGINT NOT NULL REFERENCES problem_test_cases(id) ON DELETE CASCADE,
      compiler VARCHAR(60) NOT NULL,
      source_code TEXT NOT NULL,
      stdin TEXT NOT NULL DEFAULT '',
      expected_output TEXT NOT NULL DEFAULT '',
      status VARCHAR(20) NOT NULL DEFAULT 'queued'
        CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'cancelled')),
      verdict VARCHAR(40),
      actual_output TEXT,
      callback_payload JSONB,
      time_ms INTEGER NOT NULL DEFAULT 0,
      memory_kb INTEGER NOT NULL DEFAULT 0,
      started_at TIMESTAMPTZ,
      finished_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_submission_judge_jobs_status_id
    ON submission_judge_jobs(status, id);
  `);

  await pool.query(`
    ALTER TABLE problem_test_cases
    ADD COLUMN IF NOT EXISTS sample_type VARCHAR(20) NOT NULL DEFAULT 'worked';
  `);

  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'problem_test_cases_sample_type_check'
      ) THEN
        ALTER TABLE problem_test_cases
        ADD CONSTRAINT problem_test_cases_sample_type_check
        CHECK (sample_type IN ('worked', 'failed'));
      END IF;
    END $$;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS contest_participants (
      contest_id BIGINT NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'cheater')),
      notes TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (contest_id, user_id)
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_contest_participants_contest_id
    ON contest_participants(contest_id);
  `);

  await pool.query(`
    ALTER TABLE contest_problems
    ADD COLUMN IF NOT EXISTS points INTEGER NOT NULL DEFAULT 10;
  `);

  await pool.query(`
    UPDATE submission_judge_jobs
    SET status = 'queued', started_at = NULL
    WHERE status = 'processing';
  `);
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRoutes);
app.use("/api/judge", judgeRoutes);
app.use("/api/problems", problemRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/contests", contestRoutes);
app.use("/api/admin", adminRoutes);

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: "Internal server error." });
});

ensureJudgeQueueSchema()
  .then(() => {
    app.listen(env.port, "0.0.0.0", () => {
      console.log(`Backend listening on port ${env.port}`);
    });
  })
  .catch((error) => {
    console.error("Failed to initialize database schema:", error);
    process.exit(1);
  });
