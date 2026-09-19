import assert from "node:assert/strict";
import test from "node:test";
import {
  retrievalEvaluationCases,
  RETRIEVAL_EVALUATION_SET_VERSION,
} from "../lib/rag/evaluation-cases";

test("retrieval evaluation set covers supported, guarded, and abstention paths", () => {
  assert.equal(RETRIEVAL_EVALUATION_SET_VERSION, "retrieval-eval-v1");
  assert.equal(retrievalEvaluationCases.length, 28);
  assert.equal(new Set(retrievalEvaluationCases.map((item) => item.id)).size, 28);

  const supported = retrievalEvaluationCases.filter((item) => item.category === "supported");
  assert.equal(supported.length, 18);
  assert.equal(supported.filter((item) => item.language === "ko").length, 4);
  assert.equal(supported.filter((item) => item.language === "ja").length, 2);
  for (const item of supported) {
    assert.equal(item.requiredSourceIds.length, 2);
    assert.ok(item.requiredSourceIds.some((sourceId) => sourceId.startsWith("KB-")));
    assert.ok(item.requiredSourceIds.some((sourceId) => sourceId.startsWith("POL-")));
  }

  const guarded = retrievalEvaluationCases.filter((item) => item.category === "guardrail_context");
  assert.equal(guarded.length, 4);
  assert.ok(guarded.every((item) => item.requiredSourceIds.some((sourceId) => sourceId.startsWith("POL-"))));

  const outOfScope = retrievalEvaluationCases.filter((item) => item.category === "out_of_scope");
  assert.equal(outOfScope.length, 4);
  assert.ok(outOfScope.every((item) => item.expectedNoEvidence));
  assert.ok(outOfScope.every((item) => item.requiredSourceIds.length === 0));

  const ambiguous = retrievalEvaluationCases.filter((item) => item.category === "ambiguous");
  assert.equal(ambiguous.length, 2);
  assert.ok(ambiguous.every((item) => item.requiredSourceIds.length === 0));
});
