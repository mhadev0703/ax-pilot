import "server-only";
import { getOpenAI } from "../ai/openai";
import { AppError } from "../errors";
import { EMBEDDING_DIMENSIONS, EMBEDDING_MODEL } from "./config";

export function validateEmbedding(vector: number[]) {
  if (vector.length !== EMBEDDING_DIMENSIONS || vector.some((n) => !Number.isFinite(n)) || !vector.some((n) => n !== 0)) {
    throw new AppError("INVALID_EMBEDDING", "Embedding dimensions or values do not match the configured vector space.");
  }
  return vector;
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  const client = getOpenAI();
  try {
    const response = await client.embeddings.create({ model: EMBEDDING_MODEL, dimensions: EMBEDDING_DIMENSIONS, input: texts });
    if (response.data.length !== texts.length) throw new Error("Incomplete embedding batch");
    return response.data.sort((a, b) => a.index - b.index).map((item, index) => {
      if (item.index !== index) throw new Error("Invalid embedding index");
      return validateEmbedding(item.embedding);
    });
  } catch {
    throw new AppError("EMBEDDING_FAILED", "Embedding generation failed. Check API access, quota, and embedding configuration.");
  }
}
