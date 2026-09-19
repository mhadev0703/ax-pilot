# Portfolio demo walkthrough and visual QA

Use this runbook to record a short portfolio walkthrough and capture representative screens after starting the app locally. All content shown must remain synthetic.

## Local run

Use Node 24 or newer with a configured `.env.local`, then run:

```sh
npm run dev
```

Open `http://127.0.0.1:3000/dashboard`. The Dashboard and License Optimization pages need a reachable synthetic Supabase project. Support Investigation also uses OpenAI; submitting an investigation incurs the configured API cost.

## Three representative captures

| Capture | Route and state | What the reviewer should see |
| --- | --- | --- |
| Operations signal | `/dashboard` at the default state | 30-day measurement window, KPI cards, VDI and Collaboration Platform trend chart, utilization comparison, and a proposed VDI improvement target rather than a claimed outcome |
| Evidence-backed investigation | `/investigate`, run `I reset my password and cannot access VDI.` | Classification, explicitly provisional likely cause, reviewed actions, escalation boundary, four retrieved evidence cards, and the VDI operational insight |
| Human-reviewed license decision | `/optimization`, select Collaboration Workspace Suite | Current seats, 90-day activity, 535-seat recommendation, $24,420 potential saving, decision factors, and the “Human approval required” boundary |

For the license screen, optionally click **Approve for review** to demonstrate the local review-state notice. Do not describe this as contract approval or execution.

## Narrow-screen checks

Repeat the three routes at a viewport near **390 × 844** and verify:

- The header remains readable and navigation wraps without clipping.
- Dashboard KPI cards remain legible in two columns; chart labels and utilization values do not overlap or disappear.
- Investigation hides the knowledge-coverage rail, preserves request → analysis → evidence order, and keeps source text readable.
- License choices become one column; recommendation values, factor cards, and review buttons remain accessible without horizontal scrolling.
- Focus indicators, button labels, status notices, and synthetic-data disclosures remain visible.

## Recording narrative

Lead with the operating decision rather than the model:

1. “The dashboard shows a measured support pattern and a proposed KPI, not an AI success claim.”
2. “The investigation uses retrieved evidence, then limits recommendations to reviewed, read-only actions and escalation.”
3. “The license quantity is deterministic and contract-aware; approval is intentionally outside the application.”
4. “The project is a synthetic PoC. The 28-case evaluation set is regression evidence, not a production accuracy claim.”

## Current verification status

Component tests cover investigation loading, failure, abstention, evidence navigation, license review-state behavior, and both dashboard chart series. Type checking and production builds pass.

Browser automation could not run in the Codex sandbox because its runtime exited during initialization and the local Next server could not bind `127.0.0.1:3000` (`EPERM`). Therefore, desktop and narrow-screen visual inspection remain a required local pre-publication check rather than a completed automated assertion.
