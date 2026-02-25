import dotenv from "dotenv";

dotenv.config();

const required = ["DATABASE_URL", "JWT_SECRET"];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const env = {
  port: Number(process.env.PORT || 4000),
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  onlineCompilerApiUrl: process.env.ONLINECOMPILER_API_URL || "https://onlinecompiler.io/api/v2/run-code/",
  onlineCompilerApiKey: process.env.ONLINECOMPILER_API_KEY || "",
  adminUsername: process.env.ADMIN_USERNAME || "adminlogin",
  adminPassword: process.env.ADMIN_PASSWORD || "sarcstar_r9",
  adminDisplayName: process.env.ADMIN_DISPLAY_NAME || "Sarcstar Admin"
};
