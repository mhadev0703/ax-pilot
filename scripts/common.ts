import { loadEnvConfig } from "@next/env";
import { publicError } from "../lib/errors";
import { investigationInputSchema } from "../lib/rag/schema";

loadEnvConfig(process.cwd());

export function questionFromArgs() {
  return investigationInputSchema.parse({ question: process.argv.slice(2).join(" ") || "I reset my corporate password this morning, and now I can't log into VDI." }).question;
}

export function run(main: () => Promise<void>) {
  main().catch((error: unknown) => {
    const safe = publicError(error);
    console.error(JSON.stringify({ error: { code: safe.code, message: safe.message } }, null, 2));
    process.exitCode = 1;
  });
}
