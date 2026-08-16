import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

async function main() {
  const url =
    process.env.DATABASE_URL_OWNER ??
    process.env.DATABASE_URL ??
    "postgresql://invomind_owner:invomind_owner@localhost:5432/invomind";

  console.log("Running migrations…");
  const client = postgres(url, { max: 1 });
  const db = drizzle(client);

  await migrate(db, { migrationsFolder: "./drizzle" });

  // Ensure app role can DML on all tables (covers first migrate after init)
  await client.unsafe(`
    GRANT USAGE ON SCHEMA public TO invomind_app;
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO invomind_app;
    GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO invomind_app;
  `);

  await client.end();
  console.log("Migrations complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
