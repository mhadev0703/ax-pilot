# Architecture decisions — milestone 1

1. **Use a bounded workflow.** Next.js API and CLI call the same `investigate` function. Retrieval precedes structured reasoning. No agent framework, autonomous loop, or tools for modifying enterprise systems.
2. **Separate evidence and metrics.** `enterprise_documents` contains only synthetic knowledge. `support_tickets` and `licenses` are separate structured tables. Dashboard and optimization server components read validated synthetic inputs from Supabase, then calculate metrics and recommendations in deterministic TypeScript. Knowledge document count is never used as ticket volume.
3. **Keep the first vector space fixed.** Seed and query use `text-embedding-3-small`, 1536 dimensions. SQL constrains dimension/model; the query also filters dataset version. A model or dimension change requires coordinated migration and full re-embedding, not only an env edit.
4. **Use exact cosine search initially.** Four documents do not justify approximate-nearest-neighbor indexes, chunking infrastructure, or reranking. Source IDs remain stable on reseed. Metadata defines human-reviewed allowed actions; it must be controlled by trusted dataset maintainers.
5. **Fail explicitly.** Missing credentials, provider outages, malformed outputs, and unknown source IDs are errors. An empty or insufficient evidence result is an abstention. Those are distinct conditions. Live testing showed that model-copied quotes can drift; the model now selects IDs and the server attaches complete original short-document text. This guarantees source-text fidelity, not semantic entailment of the generated explanation.
6. **Bound output authority.** The model selects action IDs. The server materializes reviewed action text only if cited sources permit it. Missing guide causes abstention; missing IAM policy withholds actions. Actual execution is absent.
7. **Treat confidence as provisional.** The 85/49 caps and 60 escalation threshold are application rules, not an empirical calibration. The similarity threshold requires positive/negative query evaluation. Model-provided cause descriptions are not formally proven by exact quote matching.
8. **Keep external clients server-only.** CLI uses the `react-server` condition to load Next.js's `server-only` marker. Runtime env validation is lazy so builds and offline tests do not need credentials. The Supabase service role is powerful and must never enter a browser bundle.
9. **Trace per request, without inventing an audit system.** The response records source identities, models, retrieval parameters, dataset version, timing, and a request ID. This is not a persistent, authenticated approval/audit trail.

## Next gate

SQL, env, four-document embedding seed, retrieval, and initial live checks have passed as of September 14, 2026 (America/New_York). Support Investigation UI now calls the same API and displays sources, provisional causes, reviewed action text, confidence caveats, and escalation. A DOM integration test covers state transitions; live HTTP verification passed. Browser launch failed in the current sandbox, so screenshot and mobile visual QA remain pending. Expand evaluation beyond the three backend smoke-test cases before claiming general reliability.

## v0.7 boundaries and next integration gate

- Structured ticket and license datasets are seeded to SQL with fixed demo date windows; Dashboard and Optimization use validated database reads while their API contract tests remain deterministic and offline.
- Support workspace: request, analysis, evidence, explicitly provisional confidence, escalation and source excerpts.
- License recommendation: deterministic active/reserved/demand/temporary inactive/buffer/contract calculations; documented overlap assumptions prevent double counting. Review/Approve/Reject records only a demo decision, never executes a change.
- Dashboard uses these same computed results, with sample size, measurement period, targets vs measured outcomes, and synthetic provenance visible.

v1.0 may extend workflows for provisioning, knowledge improvement, adoption/override metrics, vendor management, and evaluation. No tables or frameworks are introduced for those features now.

## Implementation references

- [OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs): Responses parse with Zod.
- [Supabase vector columns](https://supabase.com/docs/guides/ai/vector-columns): pgvector and RPC cosine search.
- [Next.js installation](https://nextjs.org/docs/app/getting-started/installation): App Router setup.
