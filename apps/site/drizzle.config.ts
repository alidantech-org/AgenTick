import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";
import { normalizePostgresUrl } from "./lib/db/url";

loadEnvConfig(process.cwd());

const rawUrl = process.env.DATABASE_URL;
if (!rawUrl) throw new Error("DATABASE_URL is required for Drizzle migrations");

export default defineConfig({
  dialect: "postgresql",
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: normalizePostgresUrl(rawUrl) },
  strict: true,
  verbose: true,
});
