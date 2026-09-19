import {
  getLicenseRecommendationsFromDatabase,
  getTicketAnalyticsFromDatabase,
} from "@/lib/analytics/database";
import { SupportVolumeChart } from "./support-volume-chart";

function Delta({
  value,
  invert = false,
}: {
  value: number | null;
  invert?: boolean;
}) {
  if (value === null) return <span className="delta neutral">No baseline</span>;
  const positive = value > 0;
  const favorable = invert ? !positive : positive;
  return (
    <span className={`delta ${favorable ? "favorable" : "attention"}`}>
      {positive ? "↑" : "↓"} {Math.abs(value).toFixed(1)}% vs prior period
    </span>
  );
}

export async function OperationsDashboard() {
  const [analytics, licenseRecommendations] = await Promise.all([
    getTicketAnalyticsFromDatabase(),
    getLicenseRecommendationsFromDatabase(),
  ]);
  const maxVolume = analytics.categoryVolume[0]?.value ?? 1;
  const maxLicenseSeats = Math.max(...licenseRecommendations.map((item) => item.currentSeats), 1);
  return (
    <div className="dashboard-shell">
      <header className="topbar">
        <a className="brand" href="/dashboard">
          <span className="brand-symbol" aria-hidden="true">
            A<span>↗</span>
          </span>
          <span>
            Enterprise IT <strong>AX</strong>
            <small>OPERATIONS INTELLIGENCE</small>
          </span>
        </a>
        <nav aria-label="Primary navigation">
          <a href="/investigate">Support Investigation</a>
          <a className="nav-active" href="/dashboard">
            Operations Dashboard
          </a>
          <a href="/optimization">License Optimization</a>
        </nav>
        <span className="demo-tag">
          <span className="dot" /> Synthetic environment
        </span>
      </header>
      <main className="dashboard-main">
        <div className="dashboard-heading">
          <div>
            <div className="eyebrow">OPERATIONS / PERFORMANCE REVIEW</div>
            <h1>
              Operations Dashboard<span className="version">v0.7</span>
            </h1>
            <p>
              Operational signals from a deterministic, synthetic support-ticket
              dataset.
            </p>
          </div>
          <div className="measurement">
            <span>MEASUREMENT WINDOW</span>
            <strong>{analytics.measurement.current.label}</strong>
            <small>Compared with {analytics.measurement.previous.label}</small>
          </div>
        </div>
        <section className="metric-grid" aria-label="Operational KPIs">
          <article className="metric-card">
            <span>SUPPORT REQUESTS</span>
            <strong>{analytics.supportRequests}</strong>
            <p>All synthetic tickets in the current 30-day window.</p>
          </article>
          <article className="metric-card">
            <span>AI-ASSISTED</span>
            <strong>
              {analytics.aiAssisted.rate}
              <small>%</small>
            </strong>
            <p>
              {analytics.aiAssisted.count} tickets recorded an assist event.
            </p>
          </article>
          <article className="metric-card">
            <span>REPEAT CONTACT RATE</span>
            <strong>
              {analytics.repeatContact.rate}
              <small>%</small>
            </strong>
            <p>
              {analytics.repeatContact.count} follow-ups within the synthetic
              cohort.
            </p>
          </article>
          <article className="metric-card metric-card-muted">
            <span>LICENSE REVIEW INPUTS</span>
            <strong>{licenseRecommendations.length}</strong>
            <p>
              Products with utilization, demand, and contract constraints shown below.
            </p>
          </article>
        </section>
        <section className="dashboard-grid">
          <article className="dashboard-card vdi-card">
            <div className="card-heading">
              <div>
                <span className="eyebrow">PRIORITY COHORT</span>
                <h2>VDI authentication after password reset</h2>
              </div>
              <a href="/investigate">Investigate a case ↗</a>
            </div>
            <div className="cohort-metrics">
              <div>
                <span>VDI authentication tickets</span>
                <strong>{analytics.vdiAuthentication.current}</strong>
                <Delta value={analytics.vdiAuthentication.change} />
              </div>
              <div>
                <span>Password-reset related</span>
                <strong>{analytics.passwordResetRelated.current}</strong>
                <small>
                  of {analytics.vdiAuthentication.current} current VDI
                  authentication tickets
                </small>
              </div>
              <div>
                <span>Repeat contact rate</span>
                <strong>
                  {analytics.vdiRepeatContactRate}
                  <small>%</small>
                </strong>
                <small>Within this cohort</small>
              </div>
            </div>
            <p className="cohort-note">
              The VDI increase is a workload signal. It does not establish a
              single root cause or the effectiveness of AI assistance.
            </p>
          </article>
          <article className="dashboard-card trend-card">
            <div className="card-heading">
              <div>
                <span className="eyebrow">CHANGE SIGNALS</span>
                <h2>Compare with prior 30 days</h2>
              </div>
            </div>
            <div className="trend-list">
              <div>
                <span>VDI authentication</span>
                <strong>{analytics.vdiAuthentication.current}</strong>
                <Delta value={analytics.vdiAuthentication.change} />
              </div>
              <div>
                <span>Collaboration Platform access</span>
                <strong>{analytics.groupwareAccess.current}</strong>
                <Delta value={analytics.groupwareAccess.change} invert />
              </div>
              <div>
                <span>Provisioning delays</span>
                <strong>{analytics.provisioningDelay.current}</strong>
                <Delta value={analytics.provisioningDelay.change} />
              </div>
            </div>
            <p className="small muted">
              Trend comparison uses equal 30-day UTC windows and fixed cohort
              definitions.
            </p>
          </article>
          <article className="dashboard-card support-volume-card">
            <div className="card-heading">
              <div>
                <span className="eyebrow">SUPPORT VOLUME TREND</span>
                <h2>Daily volume in the current measurement window</h2>
              </div>
              <span className="small muted">30-day UTC cohort</span>
            </div>
            <SupportVolumeChart points={analytics.dailySupportVolume} />
            <p className="small muted">
              This trend describes request volume only. It does not confirm a root cause or an improvement outcome.
            </p>
          </article>
          <article className="dashboard-card volume-card">
            <div className="card-heading">
              <div>
                <span className="eyebrow">REQUEST MIX</span>
                <h2>Current ticket volume by cohort</h2>
              </div>
              <span className="small muted">
                {analytics.supportRequests} total
              </span>
            </div>
            <div className="bar-list">
              {analytics.categoryVolume.map((item) => (
                <div className="bar-row" key={item.label}>
                  <span>{item.label}</span>
                  <div className="bar-track">
                    <i
                      style={{ width: `${(item.value / maxVolume) * 100}%` }}
                    />
                  </div>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
          </article>
          <article className="dashboard-card license-utilization-card">
            <div className="card-heading">
              <div>
                <span className="eyebrow">LICENSE UTILIZATION</span>
                <h2>Contracted seats compared with 90-day activity</h2>
              </div>
              <a href="/optimization">Review assumptions ↗</a>
            </div>
            <div className="license-bar-list">
              {licenseRecommendations.map((item) => (
                <div className="license-bar-row" key={item.product}>
                  <div>
                    <span>{item.product}</span>
                    <small>{item.utilization}% 90-day utilization</small>
                  </div>
                  <div className="license-bars" aria-label={`${item.product}: ${item.activeUsers90d} active users out of ${item.currentSeats} contracted seats`}>
                    <i className="contracted" style={{ width: `${(item.currentSeats / maxLicenseSeats) * 100}%` }} />
                    <i className="active" style={{ width: `${(item.activeUsers90d / maxLicenseSeats) * 100}%` }} />
                  </div>
                  <strong>{item.activeUsers90d} / {item.currentSeats}</strong>
                </div>
              ))}
            </div>
            <div className="license-chart-key">
              <span><i className="contracted" />Contracted seats</span>
              <span><i className="active" />90-day active users</span>
            </div>
            <p className="small muted">
              Activity is one review input. Renewal recommendations also account for reservations, upcoming demand, buffers, and contract constraints.
            </p>
          </article>
          <article className="dashboard-card opportunity-card">
            <div className="opportunity-label">
              <span aria-hidden="true">↗</span>
              <div>
                <span className="eyebrow">
                  OPERATIONAL IMPROVEMENT HYPOTHESIS
                </span>
                <h2>{analytics.operationalImprovement.title}</h2>
              </div>
            </div>
            <p>{analytics.operationalImprovement.observation}</p>
            <div className="recommendation-grid">
              {analytics.operationalImprovement.recommendation.map(
                (item, index) => (
                  <div key={item}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    {item}
                  </div>
                ),
              )}
            </div>
            <div className="target-block">
              <span>TARGET KPI</span>
              <strong>
                Reduce repeat VDI authentication inquiries by{" "}
                {analytics.operationalImprovement.target.relativeReduction}%
              </strong>
              <small>
                Proposed target — not a measured outcome. Re-measure the same
                cohort after a 30-day follow-up period.
              </small>
            </div>
          </article>
        </section>
        <section className="data-method">
          <div>
            <span className="eyebrow">DATA & METHOD</span>
            <h2>What this dashboard can and cannot say</h2>
          </div>
          <div>
            <p>
              Every metric above is calculated from {analytics.supportRequests}{" "}
              raw synthetic tickets in the stated window, with a separate{" "}
              {analytics.previousSupportRequests}-ticket comparison window. It
              uses explicit flags for AI assistance, repeat contact,
              password-reset relation, and provisioning delay.
            </p>
            <p>
              It does not claim ticket resolution, AI causality, cost savings,
              user satisfaction, or a production adoption rate. Those need a
              longer baseline, controlled operational change, and human review.
            </p>
          </div>
        </section>
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
