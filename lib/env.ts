import "server-only";
import { z } from "zod";
import { AppError } from "./errors";

const schema = z.object({
  OPENAI_API_KEY: z.string().trim().min(1),
  SUPABASE_URL: z.url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().trim().min(1),
  OPENAI_RESPONSE_MODEL: z.string().trim().min(1).default("gpt-4.1-mini"),
});

export function getEnv() {
  const result = schema.safeParse(process.env);
  if (!result.success) {
    const fields = [...new Set(result.error.issues.map((issue) => issue.path[0]))];
    throw new AppError("CONFIGURATION_REQUIRED", `Set valid server environment values: ${fields.join(", ")}.`, 503);
  }
  return result.data;
}
