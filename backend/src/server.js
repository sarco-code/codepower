import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import authRoutes from "./routes/authRoutes.js";
import problemRoutes from "./routes/problemRoutes.js";
import submissionRoutes from "./routes/submissionRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import contestRoutes from "./routes/contestRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";

const app = express();

app.use(
  cors({
    origin: env.clientUrl,
    credentials: true
  })
);
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRoutes);
app.use("/api/problems", problemRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/contests", contestRoutes);
app.use("/api/admin", adminRoutes);

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: "Internal server error." });
});

app.listen(env.port, "0.0.0.0", () => {
  console.log(`Backend listening on port ${env.port}`);
});
