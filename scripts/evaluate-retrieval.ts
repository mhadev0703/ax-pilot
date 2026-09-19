import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { AppError } from "../lib/errors";
import {
  retrievalEvaluationCases,
  RETRIEVAL_EVALUATION_SET_VERSION,
} from "../lib/rag/evaluation-cases";
import { retrieve } from "../lib/rag/retrieve";
import { run } from "./common";

run(async () => {
  const results = [];
  try {
    for (const item of retrievalEvaluationCases) {
      const documents = await retrieve(item.question);
      const sourceIds = documents.map((document) => document.source_id);
      for (const sourceId of item.requiredSourceIds) {
        assert.ok(sourceIds.includes(sourceId), `${item.id}: required source was not retrieved: ${sourceId}`);
      }
      if (item.expectedNoEvidence) {
        assert.equal(documents.length, 0, `${item.id}: out-of-scope request retrieved evidence above the configured threshold`);
      }
      results.push({
        id: item.id,
        category: item.category,
        language: item.language,
        question: item.question,
        requiredSourceIds: item.requiredSourceIds,
        retrieved: documents.map((document) => ({
          sourceId: document.source_id,
          sourceType: document.source_type,
          rank: documents.indexOf(document) + 1,
          similarity: Math.round(document.similarity * 1000) / 1000,
        })),
      });
    }
    const report = {
      status: "passed",
      synthetic: true,
      datasetVersion: "ops-slice-1",
      evaluationSetVersion: RETRIEVAL_EVALUATION_SET_VERSION,
      evaluatedCases: results.length,
      coverage: results.reduce<Record<string, number>>((counts, result) => {
        counts[result.category] = (counts[result.category] ?? 0) + 1;
        return counts;
      }, {}),
      results,
      limitation: "This is a curated retrieval regression set for two synthetic scenarios. It checks required-source recall and out-of-scope abstention at the configured threshold. The ambiguous request is recorded here but must abstain at the generation guardrail layer. This is not a general retrieval accuracy benchmark or a measure of generated-answer quality.",
    };
    await writeFile("outputs/retrieval-evaluation.json", `${JSON.stringify(report, null, 2)}\n`);
    console.log(JSON.stringify(report, null, 2));
  } catch (error) {
    if (error instanceof assert.AssertionError) {
      throw new AppError("RETRIEVAL_EVALUATION_FAILED", error.message);
    }
    throw error;
  }
});
