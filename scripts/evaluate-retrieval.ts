import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
import { AppError } from "../lib/errors";
import { retrieve } from "../lib/rag/retrieve";
import { run } from "./common";

const cases = [
  {
    id: "canonical",
    question: "I reset my password and cannot access VDI.",
    requiredSourceIds: ["KB-VDI-012", "POL-IAM-03"],
  },
  {
    id: "laptop-works",
    question: "My new password works on my laptop, but the VDI login rejects it.",
    requiredSourceIds: ["KB-VDI-012", "POL-IAM-03"],
  },
  {
    id: "existing-session",
    question: "I changed my corporate password while a VDI session was still open. Now I cannot reconnect.",
    requiredSourceIds: ["KB-VDI-012", "POL-IAM-03"],
  },
  {
    id: "lock-symptom",
    question: "VDI stopped accepting my credentials after several attempts following a password change. Could the account be locked?",
    requiredSourceIds: ["KB-VDI-012", "POL-IAM-03"],
  },
  {
    id: "korean-paraphrase",
    question: "회사 비밀번호를 변경한 뒤 노트북 로그인은 되는데 VDI 로그인이 되지 않습니다.",
    requiredSourceIds: ["KB-VDI-012", "POL-IAM-03"],
  },
  {
    id: "groupware-transfer",
    question: "I transferred departments and can sign in to groupware, but I cannot open my new team workspace.",
    requiredSourceIds: ["KB-GW-004", "POL-GW-02"],
  },
  {
    id: "groupware-korean-paraphrase",
    question: "부서 이동 후 그룹웨어 로그인은 되지만 새 팀 워크스페이스에 접근할 수 없습니다.",
    requiredSourceIds: ["KB-GW-004", "POL-GW-02"],
  },
] as const;

run(async () => {
  const results = [];
  try {
    for (const item of cases) {
      const documents = await retrieve(item.question);
      const sourceIds = documents.map((document) => document.source_id);
      for (const sourceId of item.requiredSourceIds) {
        assert.ok(sourceIds.includes(sourceId), `${item.id}: required source was not retrieved: ${sourceId}`);
      }
      results.push({
        ...item,
        retrieved: documents.map((document) => ({
          sourceId: document.source_id,
          sourceType: document.source_type,
          similarity: Math.round(document.similarity * 1000) / 1000,
        })),
      });
    }
    const report = {
      status: "passed",
      synthetic: true,
      datasetVersion: "ops-slice-1",
      evaluatedCases: results.length,
      results,
      limitation: "This checks source recall for seven curated paraphrases across two scenarios; it is not a general retrieval accuracy benchmark.",
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
