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
  judge0ApiUrl: process.env.JUDGE0_API_URL || "https://judge0-ce.p.rapidapi.com",
  judge0ApiKey: process.env.JUDGE0_API_KEY || "",
  judge0ApiHost: process.env.JUDGE0_API_HOST || "",
  adminUsername: process.env.ADMIN_USERNAME || "adminlogin",
  adminPassword: process.env.ADMIN_PASSWORD || "sarcstar_r9",
  adminDisplayName: process.env.ADMIN_DISPLAY_NAME || "Sarcstar Admin"
};
