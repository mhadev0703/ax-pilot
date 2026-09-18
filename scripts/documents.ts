import { readFile } from "node:fs/promises";
import { documentSchema } from "../lib/rag/schema";

export async function loadDocuments() {
  const paths = ["jira/INC-1042", "confluence/KB-VDI-012", "emails/MAIL-028", "policies/POL-IAM-03", "jira/INC-2071", "confluence/KB-GW-004", "emails/MAIL-061", "policies/POL-GW-02"];
  const docs = await Promise.all(paths.map(async (path) => documentSchema.parse(JSON.parse(await readFile(new URL(`../data/synthetic/${path}.json`, import.meta.url), "utf8")))));
  if (new Set(docs.map((doc) => doc.source_id)).size !== docs.length) throw new Error("Duplicate source identity");
  return docs;
}
