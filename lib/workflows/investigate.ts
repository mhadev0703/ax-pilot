import "server-only";
import { randomUUID } from "node:crypto";
import { performance } from "node:perf_hooks";
import { getEnv } from "../env";
import { answer } from "../rag/answer";
import { retrieve } from "../rag/retrieve";
import { DATASET_VERSION, EMBEDDING_MODEL, RETRIEVAL_THRESHOLD, RETRIEVAL_TOP_K } from "../rag/config";
import { investigationInputSchema } from "../rag/schema";
import { getTicketAnalytics } from "../analytics";

export async function investigate(input: unknown) {
  const { question } = investigationInputSchema.parse(input);
  const env = getEnv();
  const started = performance.now();
  const documents = await retrieve(question);
  const retrievedAt = performance.now();
  const result = await answer(question, documents);
  const ticketAnalytics = getTicketAnalytics();
  return {
    requestId: randomUUID(),
    synthetic: true,
    result,
    // Return actual sources separately from citations: retrieved does not mean used.
    retrievedEvidence: documents.map(({ metadata: _metadata, ...doc }) => doc),
    operationalInsight:
      result.status === "recommendation" && result.classification.system === "VDI" && result.classification.category === "Authentication"
        ? {
            status: "available" as const,
            measurementPeriod: ticketAnalytics.measurement.current.label,
            vdiAuthenticationTickets: ticketAnalytics.vdiAuthentication.current,
            passwordResetRelated: ticketAnalytics.passwordResetRelated.current,
            repeatContactRate: ticketAnalytics.vdiRepeatContactRate,
            knowledgeGap: ticketAnalytics.operationalImprovement.title,
            recommendations: ticketAnalytics.operationalImprovement.recommendation,
            target: ticketAnalytics.operationalImprovement.target,
            targetStatus: ticketAnalytics.operationalImprovement.targetStatus,
          }
        : {
            status: "not_applicable" as const,
            reason: "This request does not match the measured VDI password-reset cohort, so no unrelated operational insight is attached.",
          },
    trace: {
      datasetVersion: DATASET_VERSION,
      embeddingModel: EMBEDDING_MODEL,
      responseModel: documents.length ? env.OPENAI_RESPONSE_MODEL : null,
      retrievalThreshold: RETRIEVAL_THRESHOLD,
      topK: RETRIEVAL_TOP_K,
      retrievedCount: documents.length,
      retrievalMs: Math.round(retrievedAt - started),
      totalMs: Math.round(performance.now() - started),
      generatedAt: new Date().toISOString(),
    },
  };
}
