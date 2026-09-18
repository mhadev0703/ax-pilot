import "server-only";
import { z } from "zod";
import { getSupabase } from "../supabase/server";
import { AppError } from "../errors";
import { embedTexts } from "./embed";
import { DATASET_VERSION, EMBEDDING_MODEL, RETRIEVAL_THRESHOLD, RETRIEVAL_TOP_K } from "./config";
import { retrievedDocumentSchema } from "./schema";

export async function retrieve(question: string) {
  const [embedding] = await embedTexts([question]);
  const { data, error } = await getSupabase().rpc("match_enterprise_documents", {
    query_embedding: embedding,
    match_threshold: RETRIEVAL_THRESHOLD,
    match_count: RETRIEVAL_TOP_K,
    expected_model: EMBEDDING_MODEL,
    dataset_version: DATASET_VERSION,
  });
  if (error) throw new AppError("RETRIEVAL_FAILED", "Vector retrieval failed. Check the Supabase migration and service configuration.");
  const parsed = z.array(retrievedDocumentSchema).safeParse(data);
  if (!parsed.success) throw new AppError("INVALID_RETRIEVAL", "Retrieved documents did not pass dataset validation.");
  return parsed.data;
}
