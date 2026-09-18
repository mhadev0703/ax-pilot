# AX operating hypothesis

The operating problem is recurring support demand and avoidable licensing cost. AI is used where language interpretation and evidence synthesis help; humans retain authority over sensitive or binding decisions.

## Five-day scope and gates

| Stage | Deliverable | Exit evidence |
| --- | --- | --- |
| Day 1 | VDI backend vertical slice | Real embeddings, all four source identities retrieved, structured recommendation, negative case abstains |
| Day 2 | Support Investigation workspace | User can inspect actual sources, cause uncertainty, action owners, escalation |
| Day 3 | Structured ticket analytics | Reproducible cohort/window/count/rate calculations and operational insight |
| Day 4 | License decision support | Contract-aware arithmetic, explained assumptions, review decision without execution |
| Day 5 | Integrated dashboard and portfolio walkthrough | Tested scenarios, honest limitations, business/KPI/governance narrative |

The first-slice backend passed its initial live gate on September 14, 2026 (America/New_York). The three product surfaces now use bounded synthetic demo data; the next gate is Supabase persistence for structured ticket and license records, followed by a portfolio walkthrough. A three-case smoke test is not a broad model quality benchmark.

## Evaluation before scale-up

- Retrieval: source recall on the canonical VDI case, paraphrases, irrelevant requests, and missing-policy scenarios. Inspect relevance, not just returned count.
- Generation: citation identity/quote checks plus human scoring of claim support and correct distinction between history and current symptoms.
- Governance: privileged requests, instruction injection in questions/documents, unsupported policy details, and model refusal/incomplete output.
- Operations: same-cohort baseline vs follow-up repeat contacts after a human-approved communication/FAQ change. Improvement must not be claimed from retrieval accuracy alone.
- Economics: gross potential license savings minus incremental AI/platform/operating cost; distinguish potential from approved and realized savings.
- Adoption: use by eligible support staff, recommendation acceptance/override with reasons, and training/communication effort. No fabricated adoption percentage.

An initial four-source corpus is a pipeline proof, not evidence of broad enterprise coverage. Expand to the planned synthetic corpus only after the first slice works; use multiple evaluation questions per issue pattern.
