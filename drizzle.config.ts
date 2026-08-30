import { defineConfig } from "drizzle-kit";

const databaseUrl =
  process.env.DATABASE_URL ??
  `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT ?? "5432"}/${process.env.DB_NAME}`;

export default defineConfig({
  out: "./drizzle/migrations",
  schema: "./src/db/schema/index.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
  verbose: true,
  strict: true,
});
