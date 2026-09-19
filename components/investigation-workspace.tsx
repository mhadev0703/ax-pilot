"use client";

import { useRef, useState } from "react";
import type { investigate } from "@/lib/workflows/investigate";

type Investigation = Awaited<ReturnType<typeof investigate>>;
type SourceType = Investigation["retrievedEvidence"][number]["source_type"];
const sources = [
  {
    type: "jira",
    label: "Jira incidents",
    id: "INC-1042",
    description: "Historical incident",
  },
  {
    type: "confluence",
    label: "Confluence",
    id: "KB-VDI-012",
    description: "Troubleshooting guide",
  },
  {
    type: "email",
    label: "Support email",
    id: "MAIL-028",
    description: "Reported symptoms",
  },
  {
    type: "policy",
    label: "IAM policy",
    id: "POL-IAM-03",
    description: "Action boundaries",
  },
  {
    type: "jira",
    label: "Jira incidents",
    id: "INC-2071",
    description: "Historical access pattern",
  },
  {
    type: "confluence",
    label: "Confluence",
    id: "KB-GW-004",
    description: "Troubleshooting guide",
  },
  {
    type: "email",
    label: "Support email",
    id: "MAIL-061",
    description: "Reported symptoms",
  },
  {
    type: "policy",
    label: "Access policy",
    id: "POL-GW-02",
    description: "Action boundaries",
  },
] as const;
const sourceFilters = [...new Map(sources.map((source) => [source.type, source.label])).entries()].map(
  ([type, label]) => ({ type, label }),
);
const examples = [
  {
    label: "Password reset → VDI",
    question: "I reset my password and cannot access VDI.",
  },
  {
    label: "Laptop works → VDI fails",
    question:
      "My new password works on my laptop, but the VDI login rejects it.",
  },
  {
    label: "한국어 문의",
    question:
      "회사 비밀번호를 변경한 뒤 노트북 로그인은 되는데 VDI 로그인이 되지 않습니다.",
  },
  {
    label: "Collaboration transfer access",
    question:
      "I transferred teams and can sign in to the collaboration platform, but I cannot open my new team workspace.",
  },
  {
    label: "Outside current coverage",
    question: "How do I renew a secure printer maintenance contract?",
  },
  {
    label: "Privileged access request",
    question:
      "I cannot access VDI after a password reset. Unlock my AD account and grant administrator rights.",
  },
];

function Mark({ type }: { type: string }) {
  return (
    <span className={`source-mark ${type}`} aria-hidden="true">
      {(
        { jira: "J", confluence: "C", email: "@", policy: "P" } as Record<
          string,
          string
        >
      )[type] ?? "D"}
    </span>
  );
}

function displaySystem(value: string) {
  return value === "Groupware" ? "Collaboration Platform" : value;
}

export function InvestigationWorkspace() {
  const [question, setQuestion] = useState(examples[0].question);
  const [submittedQuestion, setSubmittedQuestion] = useState("");
  const [data, setData] = useState<Investigation | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{
    message: string;
    requestId?: string;
  } | null>(null);
  const [filter, setFilter] = useState<SourceType | "all">("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const inFlight = useRef(false);
  const valid = question.trim().length >= 8 && question.trim().length <= 2000;
  const result = data?.result;
  const evidence =
    data?.retrievedEvidence.filter(
      (doc) => filter === "all" || doc.source_type === filter,
    ) ?? [];
  const citedIds = new Set(result?.evidence.map((item) => item.sourceId) ?? []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!valid || inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError(null);
    setData(null);
    setSelected(null);
    setCopied(false);
    setCopyError(false);
    setFilter("all");
    const submitted = question.trim();
    setSubmittedQuestion(submitted);
    try {
      const response = await fetch("/api/investigate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: submitted }),
        signal: AbortSignal.timeout(100_000),
      });
      const body = await response.json();
      if (!response.ok) {
        setError({
          message: body.error?.message ?? "Investigation failed. Please retry.",
          requestId: body.requestId,
        });
        return;
      }
      setData(body as Investigation);
    } catch {
      setError({
        message:
          "The investigation could not be completed. Check your connection and retry. No recommendation has been recorded.",
      });
    } finally {
      setBusy(false);
      inFlight.current = false;
    }
  }

  function showSource(id: string) {
    setFilter("all");
    setSelected(id);
    requestAnimationFrame(() =>
      document
        .getElementById(`evidence-${id}`)
        ?.scrollIntoView({ behavior: "smooth", block: "nearest" }),
    );
  }

  async function copySummary() {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(
        [
          "Enterprise IT AX | SYNTHETIC DEMO | Human review required",
          `Request: ${submittedQuestion}`,
          `Classification: ${data.result.classification.system} / ${data.result.classification.category}`,
          `Provisional cause: ${data.result.likelyCause.summary}`,
          ...data.result.recommendedActions.map(
            (action, i) =>
              `${i + 1}. ${action.text} (${action.owner}; ${action.sourceIds.join(", ")})`,
          ),
          `Escalation: ${data.result.escalationTeam}. ${data.result.escalationCondition}`,
          `Confidence: ${data.result.confidence}/100 — uncalibrated, not accuracy.`,
          `Sources: ${data.result.evidence.map((item) => item.sourceId).join(", ") || "None"}`,
          `Request ID: ${data.requestId}`,
        ].join("\n"),
      );
      setCopied(true);
      setCopyError(false);
    } catch {
      setCopyError(true);
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/investigate">
          <span className="brand-symbol" aria-hidden="true">
            N<span>↗</span>
          </span>
          <span>
            Enterprise IT <strong>AX</strong>
            <small>OPERATIONS INTELLIGENCE</small>
          </span>
        </a>
        <nav aria-label="Primary navigation">
          <a className="nav-active" href="/investigate">
            Support Investigation
          </a>
          <a href="/dashboard">Operations Dashboard</a>
          <a href="/optimization">License Optimization</a>
        </nav>
        <span className="demo-tag">
          <span className="dot" /> Synthetic environment
        </span>
      </header>
      <div className="page-heading">
        <div>
          <div className="eyebrow">WORKSPACE / IT SUPPORT</div>
          <h1>
            Support Investigation<span className="version">v0.7</span>
          </h1>
          <p>Turn a support request into an evidence-backed next step.</p>
        </div>
        <div className="company">
          Example Manufacturing
          <small>Fictional enterprise · Demonstration data only</small>
        </div>
      </div>
      <main className="workspace">
        <aside className="source-panel" aria-label="Knowledge coverage">
          <div className="panel-heading">
            <h2>Knowledge coverage</h2>
            <span className="count">8</span>
          </div>
          <p className="muted small">Two supported scenarios · VDI and Collaboration Platform</p>
          <div className="source-list">
            {sources.map((source) => (
              <div className="source-row" key={source.id}>
                <Mark type={source.type} />
                <div>
                  <strong>{source.label}</strong>
                  <small>{source.description}</small>
                  <code>{source.id}</code>
                </div>
              </div>
            ))}
          </div>
          <div className="coverage-note">
            <span className="eyebrow">SCOPE BOUNDARY</span>
            <p>
              VDI authentication after password change, and Collaboration Platform workspace access after team transfer. Other issues may require human triage.
            </p>
            <small>
              Source labels represent synthetic documents, not live
              integrations.
            </small>
          </div>
          <div className="workflow-note">
            <span className="eyebrow">HOW THIS WORKS</span>
            <ol>
              <li>Retrieve relevant evidence</li>
              <li>Assess likely causes</li>
              <li>Validate supported actions</li>
              <li>Review and decide</li>
            </ol>
          </div>
          <div className="human-note">
            <span aria-hidden="true">◇</span>
            <div>
              <strong>Human judgment stays central.</strong>
              <p>
                Account changes and privileged actions remain with authorized
                administrators.
              </p>
            </div>
          </div>
        </aside>
        <section className="investigation-panel" aria-label="Investigation">
          <form className="request-card" onSubmit={submit}>
            <div className="section-kicker">
              <span className="step-number">01</span>
              <h2>Describe the issue</h2>
              <span className="small muted">Synthetic requests only</span>
            </div>
            <label className="sr-only" htmlFor="question">
              Support request
            </label>
            <textarea
              id="question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              disabled={busy}
              maxLength={2000}
              aria-describedby="question-help"
              placeholder="Describe the system, symptoms, and recent changes…"
            />
            <div className="request-footer">
              <span id="question-help" className="small muted">
                8–2,000 characters · {question.length.toLocaleString()} / 2,000
              </span>
              <button
                className="primary-button"
                disabled={!valid || busy}
                type="submit"
              >
                {busy ? (
                  <>
                    <span className="spinner" />
                    Investigating…
                  </>
                ) : (
                  <>
                    Investigate issue <span aria-hidden="true">↗</span>
                  </>
                )}
              </button>
            </div>
            <div className="examples">
              <span>TRY A SCENARIO</span>
              {examples.map((example) => (
                <button
                  type="button"
                  key={example.label}
                  disabled={busy}
                  onClick={() => setQuestion(example.question)}
                >
                  {example.label}
                </button>
              ))}
            </div>
          </form>
          <div aria-live="polite" aria-atomic="true" className="sr-only">
            {busy
              ? "Investigating your request. Retrieving evidence and checking recommendations."
              : data
                ? `Investigation complete. ${data.result.status === "insufficient_evidence" ? "Insufficient evidence. Human triage required." : "Review recommendations and sources."}`
                : ""}
          </div>
          {busy && (
            <div className="state-card loading-state" aria-busy="true">
              <div className="loading-icon">
                <span className="spinner" />
              </div>
              <h2>Reviewing enterprise evidence</h2>
              <p>
                Retrieving relevant sources and checking which actions they
                support.
              </p>
              <div className="loading-bar" />
              <small>
                This may take a moment. Recommendations will appear when
                validation completes.
              </small>
            </div>
          )}
          {error && (
            <div className="state-card error-state" role="alert">
              <span className="eyebrow">INVESTIGATION UNAVAILABLE</span>
              <h2>No recommendation returned</h2>
              <p>{error.message}</p>
              {error.requestId && <code>Reference: {error.requestId}</code>}
              <p className="small">
                You can retry using “Investigate issue” above, or request human
                investigation.
              </p>
            </div>
          )}
          {!busy && !error && !data && (
            <div className="state-card empty-state">
              <div className="empty-symbol" aria-hidden="true">
                ⌕
              </div>
              <span className="eyebrow">EVIDENCE BEFORE ACTION</span>
              <h2>A clearer path to resolution</h2>
              <p>
                Start with a request. Review the likely cause, supported next
                steps, and the source behind each recommendation.
              </p>
              <div className="empty-features">
                <span>
                  01 <strong>Classify</strong>
                </span>
                <span>
                  02 <strong>Investigate</strong>
                </span>
                <span>
                  03 <strong>Review</strong>
                </span>
              </div>
              <small>
                No investigation has run yet. Results are generated from
                retrieved evidence.
              </small>
            </div>
          )}
          {data && result && (
            <div className="analysis-card">
              <div className="section-kicker">
                <span className="step-number">02</span>
                <h2>Investigation result</h2>
                <span
                  className={`status-tag ${result.status === "insufficient_evidence" ? "amber" : "teal"}`}
                >
                  {result.status === "insufficient_evidence"
                    ? "Human triage needed"
                    : "Ready for review"}
                </span>
              </div>
              <div className="submitted-request">
                <span className="eyebrow">ANALYZED REQUEST</span>
                <p>{submittedQuestion}</p>
                {question.trim() !== submittedQuestion && (
                  <small className="edit-notice">
                    The input has changed. Run a new investigation to analyze
                    it.
                  </small>
                )}
              </div>
              <div className="classification">
                {Object.entries(result.classification).map(([label, value]) => (
                  <div key={label}>
                    <span>{label}</span>
                    <strong>{label === "system" ? displaySystem(value) : value}</strong>
                  </div>
                ))}
              </div>
              <div className="cause">
                <h3>
                  {result.status === "insufficient_evidence"
                    ? "Evidence is insufficient"
                    : "Likely cause"}
                  {result.status !== "insufficient_evidence" && (
                    <span className="subtle-tag">Hypothesis</span>
                  )}
                </h3>
                <p>{result.likelyCause.summary}</p>
                {result.likelyCause.citations.length > 0 && (
                  <div className="citation-links">
                    {result.likelyCause.citations.map((citation) => (
                      <button
                        key={citation.sourceId}
                        onClick={() => showSource(citation.sourceId)}
                      >
                        {citation.sourceId} <span aria-hidden="true">↗</span>
                      </button>
                    ))}
                  </div>
                )}
                <p className="small muted">
                  Historical evidence is not a diagnosis of the current user’s
                  account. No live account status has been checked.
                </p>
              </div>
              <div className="confidence-box">
                <div>
                  <h3>Evidence confidence</h3>
                  <p>{result.confidenceReason}</p>
                </div>
                <strong>
                  {result.confidence}
                  <small>/ 100</small>
                </strong>
                <span className="confidence-disclaimer">
                  Uncalibrated estimate · Not measured accuracy or probability
                  of resolution
                </span>
              </div>
              <div className="actions-section">
                <h3>
                  Recommended actions{" "}
                  <span className="subtle-tag">Human review required</span>
                </h3>
                {result.recommendedActions.length === 0 ? (
                  <p className="muted">
                    Actions are withheld. Ask the support team to review the
                    available evidence before proceeding.
                  </p>
                ) : (
                  <ol className="action-list">
                    {result.recommendedActions.map((action, index) => (
                      <li key={action.actionId}>
                        <span className="action-number">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <div>
                          <p>{action.text}</p>
                          <div className="action-meta">
                            <span className="owner-tag">{action.owner}</span>
                            {action.sourceIds.map((id) => (
                              <button key={id} onClick={() => showSource(id)}>
                                {id}
                              </button>
                            ))}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
              <div
                className={`escalation ${result.escalationRequired ? "escalation-required" : ""}`}
              >
                <span aria-hidden="true">↗</span>
                <div>
                  <h3>
                    {result.escalationRequired
                      ? "Escalation required"
                      : "If the issue remains unresolved"}
                  </h3>
                  <p>
                    <strong>{result.escalationTeam}</strong> ·{" "}
                    {result.escalationCondition}
                  </p>
                  <small>
                    Recommendation only. No ticket has been created or sent.
                  </small>
                </div>
              </div>
              <div className="analysis-footer">
                <span className="small muted">
                  No account changes have been executed.
                </span>
                <button className="secondary-button" onClick={copySummary}>
                  {copied ? "Summary copied" : "Copy review summary"}
                </button>
              </div>
              {copyError && (
                <p role="alert" className="small">
                  Clipboard access was unavailable. Select and copy the result
                  text manually.
                </p>
              )}
              <details className="trace">
                <summary>Investigation trace</summary>
                <dl>
                  <dt>Request ID</dt>
                  <dd>{data.requestId}</dd>
                  <dt>Dataset</dt>
                  <dd>{data.trace.datasetVersion}</dd>
                  <dt>Response model</dt>
                  <dd>
                    {data.trace.responseModel ?? "Not called — no evidence"}
                  </dd>
                  <dt>Retrieval / total time</dt>
                  <dd>
                    {data.trace.retrievalMs} ms /{" "}
                    {(data.trace.totalMs / 1000).toFixed(2)} s
                  </dd>
                  <dt>Generated</dt>
                  <dd>{data.trace.generatedAt}</dd>
                </dl>
              </details>
            </div>
          )}
          <section className="operational-note">
            <span className="insight-icon" aria-hidden="true">
              ↗
            </span>
            <div>
              <h2>From resolution to operational improvement</h2>
              {data?.operationalInsight.status === "available" ? (
                data.operationalInsight.scenario === "vdi_password_reset" ? (
                  <>
                    <p>
                      {data.operationalInsight.vdiAuthenticationTickets} VDI authentication tickets ·{" "}
                      {data.operationalInsight.passwordResetRelated} password-reset related ·{" "}
                      {data.operationalInsight.repeatContactRate}% repeat contact
                    </p>
                    <span className="subtle-tag">
                      Target: reduce repeat VDI inquiries by {data.operationalInsight.target.relativeReduction}%
                    </span>
                    <small>
                      {data.operationalInsight.measurementPeriod} · Proposed target, not measured impact. Knowledge gap: {data.operationalInsight.knowledgeGap}.
                    </small>
                  </>
                ) : (
                  <>
                    <p>
                      {data.operationalInsight.groupwareAccessTickets} Collaboration Platform access tickets ·{" "}
                      {data.operationalInsight.repeatContactRate}% repeat contact
                    </p>
                    <span className="subtle-tag">
                      Target: reduce repeat workspace-access inquiries by {data.operationalInsight.target.relativeReduction}%
                    </span>
                    <small>
                      {data.operationalInsight.measurementPeriod} · Proposed target, not measured impact. Improvement hypothesis: {data.operationalInsight.knowledgeGap}.
                    </small>
                    <small>{data.operationalInsight.caveat}</small>
                  </>
                )
              ) : (
                <>
                  <p>
                    This scenario is not tied to a measured VDI password-reset or Collaboration Platform access cohort, so no unrelated KPI is attached.
                  </p>
                  <span className="subtle-tag">No unrelated KPI attached</span>
                  <small>
                    Operational metrics come from structured ticket data, never from the retrieved knowledge-document count.
                  </small>
                </>
              )}
            </div>
          </section>
        </section>
        <aside className="evidence-panel" aria-label="Retrieved evidence">
          <div className="panel-heading">
            <h2>Evidence</h2>
            <span className="count">
              {data?.retrievedEvidence.length ?? "—"}
            </span>
          </div>
          <p className="muted small">
            Original source text, directly from retrieval.
          </p>
          <label className="filter-label" htmlFor="source-filter">
            Filter retrieved sources
          </label>
          <select
            id="source-filter"
            value={filter}
            onChange={(event) =>
              setFilter(event.target.value as SourceType | "all")
            }
            disabled={!data || busy}
          >
            <option value="all">All source types</option>
            {sourceFilters.map((source) => (
              <option key={source.type} value={source.type}>
                {source.label}
              </option>
            ))}
          </select>
          {!data ? (
            <div className="evidence-empty">
              <span aria-hidden="true">▤</span>
              <h3>{busy ? "Retrieval in progress" : "Sources appear here"}</h3>
              <p>
                {busy
                  ? "Evidence will be shown after the investigation completes."
                  : "Run an investigation to see the documents actually retrieved for your request."}
              </p>
            </div>
          ) : evidence.length === 0 ? (
            <div className="evidence-empty">
              <h3>
                {data.retrievedEvidence.length === 0
                  ? "No matching evidence"
                  : "No sources in this filter"}
              </h3>
              <p>
                {data.retrievedEvidence.length === 0
                  ? "No documents met the retrieval threshold. Human triage is the next step."
                  : "Choose another source type to view the retrieved documents."}
              </p>
            </div>
          ) : (
            <div className="evidence-list">
              {evidence.map((doc) => (
                <article
                  className={`evidence-card ${selected === doc.source_id ? "selected" : ""}`}
                  key={doc.source_id}
                  id={`evidence-${doc.source_id}`}
                >
                  <div className="evidence-top">
                    <Mark type={doc.source_type} />
                    <code>{doc.source_id}</code>
                    <span
                      className={`source-status ${citedIds.has(doc.source_id) ? "used" : ""}`}
                    >
                      {citedIds.has(doc.source_id) ? "Cited" : "Retrieved"}
                    </span>
                  </div>
                  <h3>{doc.title}</h3>
                  <p className="source-excerpt">{doc.content}</p>
                  <button
                    className="text-button"
                    aria-expanded={selected === doc.source_id}
                    aria-controls={`full-${doc.source_id}`}
                    onClick={() =>
                      setSelected(
                        selected === doc.source_id ? null : doc.source_id,
                      )
                    }
                  >
                    {selected === doc.source_id
                      ? "Hide original text −"
                      : "Read original text +"}
                  </button>
                  {selected === doc.source_id && (
                    <div id={`full-${doc.source_id}`} className="full-source">
                      <p>{doc.content}</p>
                      <small>
                        Source date: {doc.created_at.slice(0, 10)} · Synthetic
                        document
                      </small>
                    </div>
                  )}
                  <div className="similarity">
                    <span>Cosine similarity</span>
                    <code>{doc.similarity.toFixed(3)}</code>
                  </div>
                </article>
              ))}
            </div>
          )}
          <div className="evidence-footnote">
            <strong>Retrieved ≠ cited</strong>
            <p>
              A retrieved document may not support the final recommendation.
              Similarity measures retrieval relevance, not answer correctness.
            </p>
          </div>
        </aside>
      </main>
      <footer className="app-footer">
        <span>ENTERPRISE IT AX</span>
        <p>
          All enterprise data is fully synthetic. No employer or confidential
          information is included.
        </p>
        <span>Decision support · Human accountability</span>
      </footer>
    </div>
  );
}
