import "server-only";
import OpenAI from "openai";
import { getEnv } from "../env";

export function getOpenAI() {
  return new OpenAI({ apiKey: getEnv().OPENAI_API_KEY, timeout: 30_000, maxRetries: 1 });
}
