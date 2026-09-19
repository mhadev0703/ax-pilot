import { calculateTicketAnalytics, syntheticSupportTickets } from "../../lib/analytics/tickets";
import { loadDocuments } from "../../scripts/documents";

// Provider-free UI fixtures derive source text and KPIs from the current
// synthetic slice, so captured live output cannot become stale portfolio data.
export async function createVdiInvestigationFixture() {
  const docs = (await loadDocuments())
    .filter((doc) => doc.system === "VDI")
    .map((doc, index) => ({
      ...doc,
      id: `00000000-0000-4000-8000-00000000010${index}`,
      similarity: 0.82 - index * 0.07,
    }));
  const byId = new Map(docs.map((doc) => [doc.source_id, doc]));
  const cite = (sourceId: string) => ({ sourceId, quote: byId.get(sourceId)!.content });
  const analytics = calculateTicketAnalytics(syntheticSupportTickets);
  return {
    requestId: "fixture-vdi-investigation",
    synthetic: true,
    result: {
      classification: { system: "VDI", category: "Authentication", severity: "Medium" },
      likelyCause: {
        summary: "Cached credentials or an account lock may explain the symptoms; this is not a verified diagnosis.",
        citations: [cite("INC-1042")],
      },
      observedEvidence: [cite("KB-VDI-012"), cite("POL-IAM-03")],
      recommendedActions: [
        { actionId: "verify_lock_status", sourceIds: ["KB-VDI-012", "POL-IAM-03"], text: "Ask IT Support to check AD account lock status without modifying the account.", owner: "IT Support" },
        { actionId: "sign_out_vdi", sourceIds: ["KB-VDI-012"], text: "Save any accessible work, then fully sign out of the existing VDI session.", owner: "User" },
        { actionId: "reauthenticate", sourceIds: ["KB-VDI-012"], text: "Reauthenticate to VDI using the updated password.", owner: "User" },
      ],
      confidence: 85,
      confidenceReason: "Guide and policy evidence support a read-only investigation path; no live account status was checked.",
      confidenceLabel: "Uncalibrated decision-support estimate; not a probability of resolution.",
      escalationRequired: false,
      escalationTeam: "Identity Support",
      escalationCondition: "Escalate if unresolved after the recommended checks.",
      humanReviewRequired: true,
      evidence: docs.map((doc) => ({ sourceId: doc.source_id, sourceType: doc.source_type, title: doc.title, similarity: doc.similarity })),
      status: "recommendation" as const,
    },
    retrievedEvidence: docs,
    operationalInsight: {
      status: "available" as const,
      scenario: "vdi_password_reset" as const,
      measurementPeriod: analytics.measurement.current.label,
      vdiAuthenticationTickets: analytics.vdiAuthentication.current,
      passwordResetRelated: analytics.passwordResetRelated.current,
      repeatContactRate: analytics.vdiRepeatContactRate,
      knowledgeGap: analytics.operationalImprovement.title,
      recommendations: analytics.operationalImprovement.recommendation,
      target: analytics.operationalImprovement.target,
      targetStatus: analytics.operationalImprovement.targetStatus,
    },
    trace: {
      datasetVersion: "ops-slice-2",
      embeddingModel: "text-embedding-3-small",
      responseModel: "fixture-only",
      retrievalThreshold: 0.35,
      topK: 4,
      retrievedCount: docs.length,
      retrievalMs: 18,
      totalMs: 42,
      generatedAt: "2027-05-06T09:00:00.000Z",
    },
  };
}

export const insufficientEvidenceFixture = {
  requestId: "fixture-insufficient-evidence",
  synthetic: true,
  result: {
    classification: { system: "Unknown", category: "Unknown", severity: "Unknown" },
    likelyCause: { summary: "Insufficient evidence to determine a likely cause.", citations: [] },
    observedEvidence: [],
    recommendedActions: [],
    confidence: 0,
    confidenceReason: "No matching evidence met the retrieval threshold.",
    confidenceLabel: "Uncalibrated decision-support estimate; not a probability of resolution.",
    escalationRequired: true,
    escalationTeam: "IT Support",
    escalationCondition: "Human triage is required before recommending a procedure.",
    humanReviewRequired: true,
    evidence: [],
    status: "insufficient_evidence" as const,
  },
  retrievedEvidence: [],
  operationalInsight: { status: "not_applicable" as const, reason: "No matching operational cohort." },
  trace: {
    datasetVersion: "ops-slice-2",
    embeddingModel: "text-embedding-3-small",
    responseModel: null,
    retrievalThreshold: 0.35,
    topK: 4,
    retrievedCount: 0,
    retrievalMs: 0,
    totalMs: 1,
    generatedAt: "2027-05-06T09:00:00.000Z",
  },
};
