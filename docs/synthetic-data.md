# Synthetic dataset provenance

All enterprise data used in this project is fully synthetic and created solely for demonstration purposes. No proprietary or confidential information from any employer is included.

Fictional company: Example Manufacturing. Approximately 2,000 employees is a scenario assumption, not an observed statistic. Fictional departments: Engineering, Manufacturing, Quality, Finance, HR, Procurement, IT. No employee identities, addresses, IPs, live accounts, or employer infrastructure are used.

| ID | Source | Role in the first slice |
| --- | --- | --- |
| INC-1042 | Jira incident | Historical cached-credential/lock pattern; not a current diagnosis |
| KB-VDI-012 | Confluence guide | Reviewed troubleshooting sequence and escalation |
| MAIL-028 | Email | Reported symptoms only; does not authorize actions |
| POL-IAM-03 | IAM policy | Read-only support boundary and administrator-only modifications |

One document is one chunk. All records carry `synthetic: true`, company, and `dataset_version: ops-slice-1`. Action metadata is a reviewed demo control, not text to be inferred from an email. Source dates and policies are fictional. No actual integrations with Jira, Confluence, email, AD, or Groupware exist.

Dataset expansion target for final v0.7: 20–30 incidents, 8–12 knowledge pages, 10–15 emails, 5–8 SOP/policies, and 5–10 license records. The current knowledge dataset contains two four-source scenarios: VDI Authentication and Groupware Access. The first structured license dataset contains five synthetic records and the ticket dataset contains 534 synthetic records. New records must remain linked, plausible, and independently reproducible rather than padded for volume.

## License decision-support dataset

`lib/analytics/licenses.ts` defines five synthetic product records, including Enterprise Collaboration Suite. Its demonstration calculation treats 90-day active users, reserved seats, upcoming demand, a fixed operational buffer, and a contractual minimum as separate inputs. Department-survey demand is documented as already included in upcoming demand, so it is not added twice. Temporary inactivity is not an automatic removal signal. The corresponding `licenses` table contains synthetic values only and supports service-role seeding; it does not connect to a vendor, procurement system, or license-management tool.

## Support-ticket analytics dataset

`lib/analytics/tickets.ts` deterministically creates 534 synthetic raw ticket records: 284 in the current 30-day window (August 15–September 13, 2026 UTC) and 250 in the previous equal-length comparison window. Tickets have no names, email addresses, free-text requests, or employer data.

The dashboard derives current-window support volume, AI-assist rate, repeat-contact rate, VDI/password-reset counts, and comparison trends from these rows. The `support_tickets` migration and `npm run seed:tickets` persist the identical data to the synthetic Supabase project. The Dashboard server component reads those rows, validates their shape, and passes them to deterministic analytics. The local canonical source remains the reproducible seed and offline-test source.
