# Synthetic dataset provenance

All enterprise data used in this project is fully synthetic and created solely for demonstration purposes. No proprietary or confidential information from any employer is included.

Example Manufacturing is a fictional company. Its departments, people, dates, policies, usage records, tickets, and costs were independently created for this demonstration. No employee identity, email address, IP, live account, employer system design, or contract data is used.

## Evidence dataset

Each short source is one retrieval unit. All records carry `synthetic: true`, `company: Example Manufacturing`, and `dataset_version: ops-slice-2`. `allowed_actions` is reviewed demo metadata; it is not inferred from prose and emails never authorize actions.

| Scenario | ID | Source role | What it can support |
| --- | --- | --- | --- |
| VDI authentication after password change | `INC-1042` | Jira incident | Historical cached-credential or lock pattern; never a current diagnosis |
|  | `KB-VDI-012` | Confluence guide | Read-only troubleshooting sequence and Identity Support escalation |
|  | `MAIL-028` | Support email | Reported symptom context only |
|  | `POL-IAM-03` | IAM policy | Account-change boundary and administrator-only modifications |
| Collaboration Platform workspace access after transfer | `INC-2071` | Jira incident | Historical membership or role-synchronization pattern; never a current diagnosis |
|  | `KB-GW-004` | Confluence guide | Read-only membership and role-synchronization checks, reauthentication, escalation |
|  | `MAIL-061` | Support email | Reported transfer-access symptom context only |
|  | `POL-GW-02` | Access policy | Workspace membership and role-change authority boundary |

There are no live Jira, Confluence, email, directory, collaboration-platform, vendor, contract, or license-management integrations.

## Structured operational dataset

`support_tickets` contains 494 synthetic raw records: 264 in the current 30-day window (April 6–May 5, 2027 UTC) and 230 in the previous equal-length window. Records have no free-text request, name, email address, or employer data. Dashboard values derive deterministically from these rows, including support volume, AI-assist rate, repeat-contact rate, VDI/password-reset counts, Collaboration Platform Access counts, and trends.

`licenses` contains five synthetic product records. The Collaboration Workspace Suite calculation treats 90-day activity, reserved seats, upcoming demand, temporary inactivity, a defined buffer, and contract minimum as separate inputs. Department-survey demand is already included in upcoming demand and is not double counted. Temporary inactivity is not an automatic removal signal.

The local TypeScript datasets are the reproducible seed and offline-test source. Runtime Dashboard, Optimization, and investigation operational insights read equivalent validated synthetic rows from Supabase before applying deterministic calculations.

## Evaluation inputs

`retrieval-eval-v1` contains 28 synthetic user questions covering supported VDI and Collaboration Platform paraphrases, Korean and Japanese requests, privileged or source-fabrication contexts, unrelated requests, and two ambiguous requests. These questions are test inputs, not enterprise tickets or user data. The set verifies regression behavior only and is not an accuracy benchmark.
