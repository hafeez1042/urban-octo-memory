import { z } from "zod";

export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().url().optional(),
  CORS_ORIGIN: z.string().default("http://localhost:3021"),
  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),
});

export type IEnv = z.infer<typeof envSchema>;
