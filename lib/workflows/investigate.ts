import "server-only";
import { randomUUID } from "node:crypto";
import { performance } from "node:perf_hooks";
import { getEnv } from "../env";
import { answer } from "../rag/answer";
import { retrieve } from "../rag/retrieve";
import { DATASET_VERSION, EMBEDDING_MODEL, RETRIEVAL_THRESHOLD, RETRIEVAL_TOP_K } from "../rag/config";
import { investigationInputSchema } from "../rag/schema";
import { getTicketAnalyticsFromDatabase } from "../analytics/database";

export async function investigate(input: unknown) {
  const { question } = investigationInputSchema.parse(input);
  const env = getEnv();
  const started = performance.now();
  const documents = await retrieve(question);
  const retrievedAt = performance.now();
  const result = await answer(question, documents);
  const ticketAnalytics = await getTicketAnalyticsFromDatabase();
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
            scenario: "vdi_password_reset" as const,
            measurementPeriod: ticketAnalytics.measurement.current.label,
            vdiAuthenticationTickets: ticketAnalytics.vdiAuthentication.current,
            passwordResetRelated: ticketAnalytics.passwordResetRelated.current,
            repeatContactRate: ticketAnalytics.vdiRepeatContactRate,
            knowledgeGap: ticketAnalytics.operationalImprovement.title,
            recommendations: ticketAnalytics.operationalImprovement.recommendation,
            target: ticketAnalytics.operationalImprovement.target,
            targetStatus: ticketAnalytics.operationalImprovement.targetStatus,
          }
        : result.status === "recommendation" && result.classification.system === "Groupware" && result.classification.category === "Access"
          ? {
              status: "available" as const,
              scenario: "groupware_transfer_access" as const,
              measurementPeriod: ticketAnalytics.measurement.current.label,
              groupwareAccessTickets: ticketAnalytics.groupwareAccess.current,
              repeatContactRate: ticketAnalytics.groupwareRepeatContactRate,
              knowledgeGap: ticketAnalytics.groupwareOperationalImprovement.title,
              recommendations: ticketAnalytics.groupwareOperationalImprovement.recommendation,
              target: ticketAnalytics.groupwareOperationalImprovement.target,
              targetStatus: ticketAnalytics.groupwareOperationalImprovement.targetStatus,
              caveat:
                "The measured Groupware Access cohort is not tagged to department transfers. The proposed checklist and notification require a transfer-specific follow-up measurement.",
            }
        : {
            status: "not_applicable" as const,
            reason: "This request does not match a measured VDI password-reset or Groupware access cohort, so no unrelated operational insight is attached.",
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
