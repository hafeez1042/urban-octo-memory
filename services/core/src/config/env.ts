import dotenv from "dotenv";
import { envSchema, type IEnv } from "@repo/types/lib/env";

dotenv.config();

const result = envSchema.safeParse(process.env);

if (!result.success) {
  const keys = result.error.issues.map((issue) => issue.path.join(".")).join(", ");
  throw new Error(`Invalid environment configuration: ${keys}`);
}

export const env: IEnv = result.data;
export default env;
