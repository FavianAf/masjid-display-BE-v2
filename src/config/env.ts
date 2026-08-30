import { z } from "zod";

const envSchema = z
  .object({
    APP_ENV: z.string().default("development"),
    APP_PORT: z.coerce.number().int().positive().default(3000),

    DATABASE_URL: z.string().optional(),
    DB_HOST: z.string().optional(),
    DB_PORT: z.string().optional(),
    DB_USER: z.string().optional(),
    DB_PASSWORD: z.string().optional(),
    DB_NAME: z.string().optional(),
    DB_SSLMODE: z.string().optional(),

    JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
    JWT_EXPIRE_HOUR: z.coerce.number().int().positive().default(24),

    PUNYAKU_ID_SECRET: z.string().min(1, "PUNYAKU_ID_SECRET is required"),

    MYQURAN_BASE_URL: z.string().url().default("https://api.myquran.com/v3"),

    CORS_ORIGIN: z.string().default("*"),
    TRUST_PROXY: z
      .string()
      .default("false")
      .transform((v) => v === "true"),

    SUPABASE_STORAGE_ENDPOINT: z.string().optional(),
    SUPABASE_STORAGE_BUCKET: z.string().default("masjid_display_bg"),
    SUPABASE_STORAGE_SECRET_KEY: z.string().optional(),
    SUPABASE_STORAGE_MAX_FILE_SIZE: z.coerce
      .number()
      .int()
      .positive()
      .default(1_048_576),
  })
  .refine((data) => data.DATABASE_URL || (data.DB_HOST && data.DB_USER && data.DB_NAME), {
    message:
      "database configuration is missing: set DATABASE_URL, or DB_HOST/DB_USER/DB_NAME",
  });

function loadEnv() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("Invalid environment configuration:", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment configuration");
  }
  return parsed.data;
}

export const env = loadEnv();

export function buildDatabaseUrl(): string {
  if (env.DATABASE_URL) return env.DATABASE_URL;
  const sslmode = env.DB_SSLMODE ?? "disable";
  const password = env.DB_PASSWORD ?? "";
  return `postgresql://${env.DB_USER}:${password}@${env.DB_HOST}:${env.DB_PORT ?? "5432"}/${env.DB_NAME}?sslmode=${sslmode}`;
}

export function corsOrigins(): string[] | true {
  if (env.CORS_ORIGIN === "*") return true;
  return env.CORS_ORIGIN.split(",").map((s) => s.trim()).filter(Boolean);
}
