import { AppError } from "../errors";
import { modelAnalysisSchema, type ActionId, type EvidenceSelection, type ModelAnalysis, type RetrievedDocument } from "./schema";

export function resolveEvidence(selection: EvidenceSelection, documents: RetrievedDocument[]): ModelAnalysis {
  const byId = new Map(documents.map((doc) => [doc.source_id, doc]));
  const cite = (sourceId: string) => {
    const doc = byId.get(sourceId);
    if (!doc) throw new AppError("UNGROUNDED_RESPONSE", "The model selected an unknown source. Human review is required.");
    return { sourceId, quote: doc.content };
  };
  const observedEvidence = [...new Set(selection.observedSourceIds)].map(cite);
  const citations = [...new Set(selection.likelyCause.sourceIds)].map(cite);
  const selected = new Set([...observedEvidence, ...citations].map((item) => item.sourceId));
  return {
    classification: selection.classification,
    evidenceSufficient: selection.evidenceSufficient,
    observedEvidence,
    likelyCause: { summary: selection.likelyCause.summary, citations },
    recommendedActions: [...new Set(selection.actionIds)].map((actionId) => ({
      actionId,
      sourceIds: documents.filter((doc) => selected.has(doc.source_id) && doc.metadata.allowed_actions.includes(actionId)).map((doc) => doc.source_id),
    })),
    confidence: selection.confidence,
    confidenceReason: selection.confidenceReason,
    escalationRequired: selection.escalationRequired,
  };
}

// User-visible action text is reviewed code, never arbitrary model-generated instructions.
export const ACTIONS: Record<ActionId, { text: string; owner: "IT Support" | "User" }> = {
  verify_lock_status: { text: "Ask IT Support to check AD account lock status without modifying the account.", owner: "IT Support" },
  sign_out_vdi: { text: "Save any accessible work, then fully sign out of the existing VDI session.", owner: "User" },
  reauthenticate: { text: "Reauthenticate to VDI using the updated password.", owner: "User" },
  verify_sync: { text: "If the issue persists, ask IT Support to verify credential synchronization status without changing account settings.", owner: "IT Support" },
  verify_groupware_membership: { text: "Ask IT Support to verify the groupware workspace membership status without changing access.", owner: "IT Support" },
  sign_out_groupware: { text: "Fully sign out of the groupware application, then close and reopen the browser session.", owner: "User" },
  reauthenticate_groupware: { text: "Sign in to groupware again with the current corporate credentials.", owner: "User" },
  verify_role_sync: { text: "If access remains unavailable, ask IT Support to verify role synchronization status without changing membership or roles.", owner: "IT Support" },
};

const SCENARIOS = {
  "VDI:Authentication": {
    guideId: "KB-VDI-012",
    policyId: "POL-IAM-03",
    escalationTeam: "Identity Support",
  },
  "Groupware:Access": {
    guideId: "KB-GW-004",
    policyId: "POL-GW-02",
    escalationTeam: "Enterprise Applications Support",
  },
} as const;

export function insufficientEvidence(reason: string) {
  return {
    classification: { system: "Unknown", category: "Unknown", severity: "Unknown" },
    likelyCause: { summary: "Insufficient evidence to determine a likely cause.", citations: [] },
    observedEvidence: [],
    recommendedActions: [],
    confidence: 0,
    confidenceReason: reason,
    confidenceLabel: "Uncalibrated decision-support estimate; not a probability of resolution.",
    escalationRequired: true,
    escalationTeam: "IT Support",
    escalationCondition: "Human triage is required before recommending a procedure.",
    humanReviewRequired: true,
    evidence: [],
    status: "insufficient_evidence" as const,
  };
}

export function groundAnalysis(raw: ModelAnalysis, documents: RetrievedDocument[]) {
  const analysis = modelAnalysisSchema.parse(raw);
  const byId = new Map(documents.map((doc) => [doc.source_id, doc]));
  const citations = [...analysis.observedEvidence, ...analysis.likelyCause.citations];
  const citedIds = new Set(citations.map((citation) => citation.sourceId));
  for (const citation of citations) {
    const doc = byId.get(citation.sourceId);
    if (!doc || !doc.content.includes(citation.quote)) {
      throw new AppError("UNGROUNDED_RESPONSE", "The generated response contained an unverifiable citation. Human review is required.");
    }
  }
  for (const action of analysis.recommendedActions) {
    if (action.sourceIds.length === 0 || action.sourceIds.some((id) => !byId.get(id)?.metadata.allowed_actions.includes(action.actionId) || !citedIds.has(id))) {
      throw new AppError("UNGROUNDED_ACTION", "The generated action is not supported by cited, approved guidance. Human review is required.");
    }
  }
  const scenario = SCENARIOS[`${analysis.classification.system}:${analysis.classification.category}` as keyof typeof SCENARIOS];
  if (!scenario || !analysis.evidenceSufficient || analysis.likelyCause.citations.length === 0) {
    return insufficientEvidence("The retrieved and cited evidence does not establish a supported investigation procedure.");
  }
  // Historical incidents are pattern evidence, never confirmation of current system state.
  const hasGuide = citedIds.has(scenario.guideId);
  const hasPolicy = citedIds.has(scenario.policyId);
  if (!hasGuide) return insufficientEvidence("The retrieved and cited evidence does not include the required troubleshooting guide.");
  const confidence = Math.min(analysis.confidence, hasPolicy ? 85 : 49);
  const escalationRequired = analysis.escalationRequired || !hasPolicy || confidence < 60;
  const evidence = [...citedIds].map((id) => {
    const doc = byId.get(id)!;
    return { sourceId: doc.source_id, sourceType: doc.source_type, title: doc.title, similarity: doc.similarity };
  });
  return {
    classification: analysis.classification,
    likelyCause: analysis.likelyCause,
    observedEvidence: analysis.observedEvidence,
    recommendedActions: hasPolicy
      ? [...new Map(analysis.recommendedActions.map((action) => [action.actionId, { ...action, ...ACTIONS[action.actionId] }])).values()]
      : [],
    confidence,
    confidenceReason: hasPolicy ? analysis.confidenceReason : "IAM policy evidence is missing. Withhold actions and request human review.",
    confidenceLabel: "Uncalibrated decision-support estimate; not a probability of resolution.",
    escalationRequired,
    escalationTeam: scenario.escalationTeam,
    escalationCondition: escalationRequired ? "Review before proceeding." : "Escalate if unresolved after the recommended checks.",
    humanReviewRequired: true,
    evidence,
    status: "recommendation" as const,
  };
}
