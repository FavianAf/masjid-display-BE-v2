import { migrate } from "drizzle-orm/postgres-js/migrator";
import { db, client } from "./index";

async function main() {
  console.log("Running migrations...");
  await migrate(db, { migrationsFolder: "./drizzle/migrations" });
  console.log("Migrations complete.");
  await client.end();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
