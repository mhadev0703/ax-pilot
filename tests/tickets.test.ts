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
  assert.equal(syntheticSupportTickets.length, 494);
  assert.equal(analytics.supportRequests, 264);
  assert.equal(analytics.previousSupportRequests, 230);
  assert.deepEqual(analytics.aiAssisted, { count: 116, rate: 43.9 });
  assert.deepEqual(analytics.repeatContact, { count: 45, rate: 17 });
  assert.deepEqual(analytics.vdiAuthentication, {
    current: 73,
    previous: 56,
    change: 30.4,
  });
  assert.deepEqual(analytics.passwordResetRelated, {
    current: 31,
    previous: 20,
  });
  assert.equal(analytics.vdiRepeatContactRate, 23.3);
  assert.deepEqual(analytics.provisioningDelay, {
    current: 22,
    previous: 18,
    change: 22.2,
  });
  assert.deepEqual(analytics.groupwareAccess, {
    current: 61,
    previous: 68,
    change: -10.3,
  });
  assert.equal(analytics.groupwareRepeatContactRate, 18);
  assert.equal(
    analytics.groupwareOperationalImprovement.target.relativeReduction,
    20,
  );
  assert.equal(analytics.dailySupportVolume.length, 30);
  assert.equal(
    analytics.dailySupportVolume.reduce((total, day) => total + day.vdiAuthentication, 0),
    73,
  );
  assert.equal(
    analytics.dailySupportVolume.reduce((total, day) => total + day.groupwareAccess, 0),
    61,
  );
  assert.equal(analytics.measurement.current.label, "Apr 6 – May 5, 2027");
  assert.equal(analytics.measurement.previous.label, "Mar 7 – Apr 5, 2027");
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
  assert.equal(analytics.supportRequests, 264);
  assert.equal(analytics.operationalImprovement.target.relativeReduction, 30);
  assert.equal(analytics.synthetic, true);
});
