export const EMBEDDING_MODEL = "text-embedding-3-small";
export const EMBEDDING_DIMENSIONS = 1536;
export const RETRIEVAL_TOP_K = 4;
// A wider candidate pool lets deterministic selection retain a guide and its
// governance policy instead of letting symptom-heavy documents crowd them out.
export const RETRIEVAL_CANDIDATE_COUNT = 8;
// Initial PoC threshold, not an accuracy score. Calibrate with positive and negative queries.
export const RETRIEVAL_THRESHOLD = 0.35;
export const DATASET_VERSION = "ops-slice-1";
