import { z } from "zod";

export const actionIdSchema = z.enum([
  "verify_lock_status", "sign_out_vdi", "reauthenticate", "verify_sync",
  "verify_groupware_membership", "sign_out_groupware", "reauthenticate_groupware", "verify_role_sync",
]);
export type ActionId = z.infer<typeof actionIdSchema>;

export const documentSchema = z.object({
  source_type: z.enum(["jira", "confluence", "email", "policy", "manual", "vendor_document"]),
  source_id: z.string().min(1),
  title: z.string().min(1),
  content: z.string().min(1),
  system: z.string().min(1),
  category: z.string().min(1),
  department: z.string().min(1),
  // PostgREST serializes timestamptz with +00:00; fixtures use the equivalent Z.
  created_at: z.iso.datetime({ offset: true }),
  metadata: z.object({
    synthetic: z.literal(true),
    company: z.literal("Example Manufacturing"),
    dataset_version: z.literal("ops-slice-2"),
    allowed_actions: z.array(actionIdSchema),
  }),
});
export const retrievedDocumentSchema = documentSchema.extend({
  id: z.uuid(),
  similarity: z.number().min(-1.00001).max(1.00001),
});
export type EnterpriseDocument = z.infer<typeof documentSchema>;
export type RetrievedDocument = z.infer<typeof retrievedDocumentSchema>;

export const investigationInputSchema = z.object({
  question: z.string().trim().min(8).max(2_000),
}).strict();

const citationSchema = z.object({ sourceId: z.string(), quote: z.string().min(1) });
export const modelAnalysisSchema = z.object({
  classification: z.object({
    system: z.enum(["VDI", "Groupware", "Unknown"]),
    category: z.enum(["Authentication", "Access", "Unknown"]),
    severity: z.enum(["Low", "Medium", "High", "Unknown"]),
  }),
  evidenceSufficient: z.boolean(),
  observedEvidence: z.array(citationSchema),
  likelyCause: z.object({ summary: z.string(), citations: z.array(citationSchema) }),
  recommendedActions: z.array(z.object({ actionId: actionIdSchema, sourceIds: z.array(z.string()) })),
  confidence: z.number().int().min(0).max(100),
  confidenceReason: z.string(),
  escalationRequired: z.boolean(),
});
export type ModelAnalysis = z.infer<typeof modelAnalysisSchema>;

// Short documents are the evidence units. The model selects identities; the server
// attaches their original content so paraphrased text cannot masquerade as a quote.
export const evidenceSelectionSchema = z.object({
  classification: modelAnalysisSchema.shape.classification,
  evidenceSufficient: z.boolean(),
  observedSourceIds: z.array(z.string()),
  likelyCause: z.object({ summary: z.string(), sourceIds: z.array(z.string()) }),
  actionIds: z.array(actionIdSchema),
  confidence: z.number().int().min(0).max(100),
  confidenceReason: z.string(),
  escalationRequired: z.boolean(),
});
export type EvidenceSelection = z.infer<typeof evidenceSelectionSchema>;
