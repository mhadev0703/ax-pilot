import assert from "node:assert/strict";
import test from "node:test";
import { calculateTicketAnalyticsFromDatabaseRows } from "../lib/analytics/database";
import {
  ANALYTICS_WINDOWS,
  calculateTicketAnalytics,
  syntheticSupportTickets,
} from "../lib/analytics/tickets";

test("ticket analytics derives the dashboard KPI values from raw synthetic tickets", () => {
  const analytics = calculateTicketAnalytics(syntheticSupportTickets);
  assert.equal(syntheticSupportTickets.length, 534);
  assert.equal(analytics.supportRequests, 284);
  assert.equal(analytics.previousSupportRequests, 250);
  assert.deepEqual(analytics.aiAssisted, { count: 131, rate: 46.1 });
  assert.deepEqual(analytics.repeatContact, { count: 51, rate: 18 });
  assert.deepEqual(analytics.vdiAuthentication, {
    current: 87,
    previous: 68,
    change: 27.9,
  });
  assert.deepEqual(analytics.passwordResetRelated, {
    current: 39,
    previous: 26,
  });
  assert.equal(analytics.vdiRepeatContactRate, 24.1);
  assert.deepEqual(analytics.provisioningDelay, {
    current: 24,
    previous: 22,
    change: 9.1,
  });
  assert.deepEqual(analytics.groupwareAccess, {
    current: 58,
    previous: 66,
    change: -12.1,
  });
  assert.equal(analytics.measurement.current.label, "Aug 15 – Sep 13, 2026");
  assert.equal(analytics.measurement.previous.label, "Jul 16 – Aug 14, 2026");
});

test("synthetic ticket flags remain inside their defined cohorts and windows do not overlap", () => {
  for (const ticket of syntheticSupportTickets) {
    assert.equal(ticket.synthetic, true);
    if (ticket.password_reset_related)
      assert.deepEqual(
        [ticket.system, ticket.category],
        ["VDI", "Authentication"],
      );
    if (ticket.provisioning_delay)
      assert.deepEqual(
        [ticket.system, ticket.category],
        ["Provisioning", "Provisioning"],
      );
    const current =
      ticket.created_at >= ANALYTICS_WINDOWS.current.start &&
      ticket.created_at < ANALYTICS_WINDOWS.current.end;
    const previous =
      ticket.created_at >= ANALYTICS_WINDOWS.previous.start &&
      ticket.created_at < ANALYTICS_WINDOWS.previous.end;
    assert.notEqual(
      current,
      previous,
      `${ticket.ticket_id} must belong to exactly one measurement window`,
    );
  }
});

test("database-shaped ticket rows use the same deterministic KPI calculation", () => {
  const analytics = calculateTicketAnalyticsFromDatabaseRows(syntheticSupportTickets);
  assert.equal(analytics.supportRequests, 284);
  assert.equal(analytics.operationalImprovement.target.relativeReduction, 30);
  assert.equal(analytics.synthetic, true);
});
