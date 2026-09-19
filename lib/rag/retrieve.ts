import "server-only";
import { z } from "zod";
import { getSupabase } from "../supabase/server";
import { AppError } from "../errors";
import { embedTexts } from "./embed";
import {
  DATASET_VERSION,
  EMBEDDING_MODEL,
  RETRIEVAL_CANDIDATE_COUNT,
  RETRIEVAL_THRESHOLD,
  RETRIEVAL_TOP_K,
} from "./config";
import { retrievedDocumentSchema, type RetrievedDocument } from "./schema";

const preferredSourceTypes = ["confluence", "policy"] as const;

export function selectScenarioEvidence(candidates: RetrievedDocument[]) {
  const lead = candidates[0];
  // The relevance gate remains at the configured threshold. Lower-scoring
  // documents can only accompany a strong same-scenario lead as governance evidence.
  if (!lead || lead.similarity < RETRIEVAL_THRESHOLD) return [];

  const sameScenario = candidates.filter(
    (document) =>
      document.system === lead.system && document.category === lead.category,
  );
  const preferred = preferredSourceTypes.flatMap((sourceType) =>
    sameScenario.filter((document) => document.source_type === sourceType).slice(0, 1),
  );
  const remaining = sameScenario.filter(
    (document) => !preferred.some((item) => item.source_id === document.source_id),
  );
  const selectedIds = new Set(
    [...preferred, ...remaining]
      .slice(0, RETRIEVAL_TOP_K)
      .map((document) => document.source_id),
  );
  // Keep the vector ranking visible to reviewers. Diversity determines which
  // documents are retained, not how their similarity rank is represented.
  return sameScenario.filter((document) => selectedIds.has(document.source_id));
}

export async function retrieve(question: string) {
  const [embedding] = await embedTexts([question]);
  const { data, error } = await getSupabase().rpc("match_enterprise_documents", {
    query_embedding: embedding,
    // Fetch a bounded candidate pool, then apply the relevance gate locally.
    // This preserves a lower-similarity policy only when a matching scenario is
    // already strongly relevant; it does not weaken out-of-scope abstention.
    match_threshold: -1,
    match_count: RETRIEVAL_CANDIDATE_COUNT,
    expected_model: EMBEDDING_MODEL,
    dataset_version: DATASET_VERSION,
  });
  if (error) throw new AppError("RETRIEVAL_FAILED", "Vector retrieval failed. Check the Supabase migration and service configuration.");
  const parsed = z.array(retrievedDocumentSchema).safeParse(data);
  if (!parsed.success) throw new AppError("INVALID_RETRIEVAL", "Retrieved documents did not pass dataset validation.");
  return selectScenarioEvidence(parsed.data);
}
