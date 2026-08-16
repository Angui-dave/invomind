import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./lib/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url:
      process.env.DATABASE_URL_OWNER ??
      process.env.DATABASE_URL ??
      "postgresql://invomind_owner:invomind_owner@localhost:5432/invomind",
  },
  strict: true,
  verbose: true,
});
