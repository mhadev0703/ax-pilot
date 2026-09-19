import assert from "node:assert/strict";
import test from "node:test";
import { loadDocuments } from "../scripts/documents";
import { applyRequestEscalation, groundAnalysis, insufficientEvidence, resolveEvidence } from "../lib/rag/guardrails";
import { validateEmbedding } from "../lib/rag/embed";
import { documentSchema, investigationInputSchema, modelAnalysisSchema, type ModelAnalysis, type RetrievedDocument } from "../lib/rag/schema";

test("database timestamps accept explicit UTC offsets but reject missing timezones", async () => {
  const [doc] = await loadDocuments();
  assert.equal(documentSchema.safeParse({ ...doc, created_at: "2027-04-11T14:00:00+00:00" }).success, true);
  assert.equal(documentSchema.safeParse({ ...doc, created_at: "2027-04-11T14:00:00" }).success, false);
});
import { publicError } from "../lib/errors";
import { answer } from "../lib/rag/answer";
import { selectScenarioEvidence } from "../lib/rag/retrieve";
import { isWithinSupportedInvestigationScope } from "../lib/rag/scope";

async function fixture() {
  const docs: RetrievedDocument[] = (await loadDocuments()).map((doc, index) => ({ ...doc, id: `00000000-0000-4000-8000-00000000000${index}`, similarity: 0.7 }));
  const quote = (sourceId: string) => ({ sourceId, quote: docs.find((doc) => doc.source_id === sourceId)!.content });
  const analysis: ModelAnalysis = {
    classification: { system: "VDI", category: "Authentication", severity: "Medium" },
    evidenceSufficient: true,
    observedEvidence: [quote("KB-VDI-012"), quote("POL-IAM-03")],
    likelyCause: { summary: "Cached credentials or an account lock may explain the symptoms; this is not a verified diagnosis.", citations: [quote("INC-1042")] },
    recommendedActions: [{ actionId: "verify_lock_status", sourceIds: ["POL-IAM-03"] }],
    confidence: 99,
    confidenceReason: "Historical evidence supports the hypothesis but no live account status was checked.",
    escalationRequired: false,
  };
  return { docs, analysis };
}

test("synthetic dataset has eight distinct source identities across two supported scenarios", async () => {
  const docs = await loadDocuments();
  assert.deepEqual(docs.map((doc) => doc.source_id), ["INC-1042", "KB-VDI-012", "MAIL-028", "POL-IAM-03", "INC-2071", "KB-GW-004", "MAIL-061", "POL-GW-02"]);
  assert.ok(docs.every((doc) => doc.metadata.synthetic));
});

test("Groupware access requires its own guide and policy, with no membership mutation", async () => {
  const docs = (await loadDocuments())
    .filter((doc) => doc.system === "Groupware")
    .map((doc, index) => ({ ...doc, id: `00000000-0000-4000-8000-00000000001${index}`, similarity: 0.7 })) as RetrievedDocument[];
  const quote = (sourceId: string) => ({ sourceId, quote: docs.find((doc) => doc.source_id === sourceId)!.content });
  const analysis: ModelAnalysis = {
    classification: { system: "Groupware", category: "Access", severity: "Medium" },
    evidenceSufficient: true,
    observedEvidence: [quote("KB-GW-004"), quote("POL-GW-02")],
    likelyCause: { summary: "Workspace membership or role synchronization may not yet reflect the approved transfer; this is not a verified diagnosis.", citations: [quote("INC-2071")] },
    recommendedActions: [{ actionId: "verify_groupware_membership", sourceIds: ["KB-GW-004", "POL-GW-02"] }],
    confidence: 92,
    confidenceReason: "Guide and policy define read-only investigation boundaries.",
    escalationRequired: false,
  };
  const result = groundAnalysis(analysis, docs);
  assert.equal(result.status, "recommendation");
  assert.equal(result.confidence, 85);
  assert.equal(result.escalationTeam, "Enterprise Applications Support");
  assert.match(result.recommendedActions[0].text, /without changing access/);
  const withoutPolicy = groundAnalysis({ ...analysis, observedEvidence: [quote("KB-GW-004")], recommendedActions: [{ actionId: "verify_groupware_membership", sourceIds: ["KB-GW-004"] }] }, docs.filter((doc) => doc.source_id !== "POL-GW-02"));
  assert.equal(withoutPolicy.confidence, 49);
  assert.deepEqual(withoutPolicy.recommendedActions, []);
});

test("grounded recommendation caps confidence and preserves human ownership", async () => {
  const { docs, analysis } = await fixture();
  const result = groundAnalysis(analysis, docs);
  assert.equal(result.status, "recommendation");
  assert.equal(result.confidence, 85);
  assert.equal(result.humanReviewRequired, true);
  assert.equal(result.recommendedActions[0].owner, "IT Support");
  assert.match(result.recommendedActions[0].text, /without modifying/);
});

test("privileged requests require server-enforced escalation in English, Korean, and Japanese", async () => {
  const { docs, analysis } = await fixture();
  const result = groundAnalysis(analysis, docs);
  for (const request of [
    "Unlock my account and grant administrator access.",
    "계정 잠금을 해제하고 관리자 권한을 변경해 주세요.",
    "アカウントロックを解除して管理者権限を変更してください。",
  ]) {
    assert.equal(applyRequestEscalation(result, request).escalationRequired, true);
  }
});

test("fabricated source identity is rejected", async () => {
  const { docs, analysis } = await fixture();
  analysis.likelyCause.citations[0].sourceId = "POL-FAKE";
  assert.throws(() => groundAnalysis(analysis, docs), /unverifiable citation/);
});

test("selected sources resolve to original text and only authorized action citations", async () => {
  const { docs, analysis } = await fixture();
  const selection = {
    classification: analysis.classification, evidenceSufficient: true,
    observedSourceIds: ["KB-VDI-012", "POL-IAM-03"],
    likelyCause: { summary: analysis.likelyCause.summary, sourceIds: ["INC-1042"] },
    actionIds: ["sign_out_vdi" as const], confidence: 75, confidenceReason: "Provisional", escalationRequired: false,
  };
  const result = resolveEvidence(selection, docs);
  assert.equal(result.observedEvidence[0].quote, docs.find((d) => d.source_id === "KB-VDI-012")!.content);
  assert.ok(!result.recommendedActions[0].sourceIds.includes("POL-IAM-03"));
  assert.equal(groundAnalysis(result, docs).recommendedActions.length, 1);
  assert.throws(() => resolveEvidence({ ...selection, observedSourceIds: ["FAKE"] }, docs), /unknown source/);
  const unsupported = resolveEvidence({ ...selection, observedSourceIds: ["MAIL-028"], likelyCause: { summary: "Unknown", sourceIds: [] } }, docs);
  assert.throws(() => groundAnalysis(unsupported, docs), /not supported/);
});

test("fabricated verbatim quote is rejected", async () => {
  const { docs, analysis } = await fixture();
  analysis.likelyCause.citations[0].quote = "Unlock every account automatically after five minutes.";
  assert.throws(() => groundAnalysis(analysis, docs), /unverifiable citation/);
});

test("email symptoms cannot authorize a troubleshooting action", async () => {
  const { docs, analysis } = await fixture();
  analysis.observedEvidence.push({ sourceId: "MAIL-028", quote: docs[2].content });
  analysis.recommendedActions[0].sourceIds = ["MAIL-028"];
  assert.throws(() => groundAnalysis(analysis, docs), /not supported/);
});

test("missing IAM evidence withholds actions and forces review", async () => {
  const { docs, analysis } = await fixture();
  analysis.observedEvidence = analysis.observedEvidence.filter((citation) => citation.sourceId !== "POL-IAM-03");
  analysis.recommendedActions[0].sourceIds = ["KB-VDI-012"];
  const result = groundAnalysis(analysis, docs.filter((doc) => doc.source_id !== "POL-IAM-03"));
  assert.equal(result.confidence, 49);
  assert.deepEqual(result.recommendedActions, []);
  assert.equal(result.escalationRequired, true);
});

test("missing guide does not produce a procedure", async () => {
  const { docs, analysis } = await fixture();
  analysis.observedEvidence = analysis.observedEvidence.filter((citation) => citation.sourceId !== "KB-VDI-012");
  assert.equal(groundAnalysis(analysis, docs).status, "insufficient_evidence");
});

test("insufficient or out-of-scope analysis abstains even with high model confidence", async () => {
  const { docs, analysis } = await fixture();
  analysis.evidenceSufficient = false;
  const result = groundAnalysis(analysis, docs);
  assert.equal(result.confidence, 0);
  assert.equal(result.escalationRequired, true);
  assert.deepEqual(result.recommendedActions, []);
});

test("no retrieved evidence bypasses LLM and returns explicit abstention", async () => {
  const result = await answer("A question without evidence", []);
  assert.equal(result.status, "insufficient_evidence");
  assert.equal(result.confidence, 0);
  assert.deepEqual(result.evidence, []);
});

test("schema cannot represent arbitrary privileged actions", async () => {
  const { analysis } = await fixture();
  assert.equal(modelAnalysisSchema.safeParse({ ...analysis, recommendedActions: [{ actionId: "unlock_account", sourceIds: ["POL-IAM-03"] }] }).success, false);
});

test("confidence uses integer percentage points, not a fractional probability", async () => {
  const { analysis } = await fixture();
  assert.equal(modelAnalysisSchema.safeParse({ ...analysis, confidence: 0.85 }).success, false);
  assert.equal(modelAnalysisSchema.safeParse({ ...analysis, confidence: 85 }).success, true);
});

test("embedding dimensions and numerical values are enforced", () => {
  assert.throws(() => validateEmbedding([0.1]), /dimensions or values/);
  assert.throws(() => validateEmbedding(Array(1536).fill(NaN)), /dimensions or values/);
  assert.throws(() => validateEmbedding(Array(1536).fill(0)), /dimensions or values/);
  assert.equal(validateEmbedding(Array(1536).fill(0.1)).length, 1536);
});

test("retrieval selection retains a scenario guide and policy without weakening the relevance gate", async () => {
  const docs = (await loadDocuments()).map((doc, index) => ({
    ...doc,
    id: `00000000-0000-4000-8000-00000000002${index}`,
    similarity: [0.8, 0.41, 0.74, 0.3, 0.91, 0.68, 0.83, 0.29][index],
  })) as RetrievedDocument[];
  const selected = selectScenarioEvidence([...docs].sort((left, right) => right.similarity - left.similarity));
  assert.deepEqual(
    selected.map((document) => document.source_id),
    ["INC-2071", "MAIL-061", "KB-GW-004", "POL-GW-02"],
  );

  const belowThreshold = selectScenarioEvidence(
    docs.map((document) => ({ ...document, similarity: 0.34 })),
  );
  assert.deepEqual(belowThreshold, []);
});

test("scope gate requires a supported system and recent-change context before retrieval", () => {
  assert.equal(isWithinSupportedInvestigationScope("I reset my password and cannot access VDI."), true);
  assert.equal(isWithinSupportedInvestigationScope("부서 이동 후 그룹웨어 새 팀 워크스페이스에 접근할 수 없습니다."), true);
  assert.equal(isWithinSupportedInvestigationScope("パスワードを変更した後、VDIにログインできなくなりました。"), true);
  assert.equal(isWithinSupportedInvestigationScope("部署異動後、新しいチームのワークスペースにアクセスできません。"), true);
  assert.equal(isWithinSupportedInvestigationScope("社内システムにアクセスできません。どうすればいいですか？"), false);
  assert.equal(isWithinSupportedInvestigationScope("I cannot access my tools. Please help."), false);
  assert.equal(isWithinSupportedInvestigationScope("My VDI is slow."), false);
  assert.equal(isWithinSupportedInvestigationScope("How do I renew a secure printer maintenance contract?"), false);
});

test("invalid requests are rejected before provider calls", () => {
  for (const input of [{ question: " " }, { question: "a".repeat(2001) }, { question: "Valid question", execute: true }, { question: 42 }]) {
    assert.equal(investigationInputSchema.safeParse(input).success, false);
  }
});

test("unexpected provider error details never become public", () => {
  assert.ok(!JSON.stringify(publicError(new Error("secret-token database-password"))).includes("secret-token"));
  assert.equal(insufficientEvidence("Missing evidence").humanReviewRequired, true);
});
