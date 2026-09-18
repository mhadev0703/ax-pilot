import { run } from "./common";
import { loadDocuments } from "./documents";
import { embedTexts } from "../lib/rag/embed";
import { EMBEDDING_MODEL } from "../lib/rag/config";
import { getSupabase } from "../lib/supabase/server";
import { AppError } from "../lib/errors";

run(async () => {
  const documents = await loadDocuments();
  const vectors = await embedTexts(documents.map((doc) => `${doc.title}\nSystem: ${doc.system}\nCategory: ${doc.category}\n${doc.content}`));
  const { error } = await getSupabase().from("enterprise_documents").upsert(
    documents.map((doc, index) => ({ ...doc, embedding_model: EMBEDDING_MODEL, embedding: vectors[index] })),
    { onConflict: "source_id" },
  );
  if (error) throw new AppError("SEED_FAILED", "Seed failed. Check the migration and server credentials; no success has been recorded.");
  console.log(JSON.stringify({ seeded: documents.map((doc) => doc.source_id), embeddingModel: EMBEDDING_MODEL, synthetic: true }, null, 2));
});
