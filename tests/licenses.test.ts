import assert from "node:assert/strict";
import test from "node:test";
import { calculateLicenseRecommendationsFromDatabaseRows } from "../lib/analytics/database";
import { calculateLicenseRecommendation, syntheticLicenseRecords, syntheticLicenseRecommendations } from "../lib/analytics/licenses";

test("collaboration renewal quantity uses active users, reservations, demand, buffer, and contract floor", () => {
  const recommendation = syntheticLicenseRecommendations[0];
  assert.equal(recommendation.product, "Enterprise Collaboration Suite");
  assert.equal(recommendation.utilization, 60.4);
  assert.deepEqual(recommendation.calculation, { demandBase: 360, unconstrainedRecommendation: 380, contractMinimum: 350 });
  assert.equal(recommendation.recommendedSeats, 380);
  assert.equal(recommendation.reduction, 120);
  assert.equal(recommendation.estimatedAnnualSaving, 17_280);
  assert.equal(recommendation.estimatedAnnualSavingLabel, "$17,280");
  assert.equal(recommendation.risk, "Medium");
  assert.equal(recommendation.humanApprovalRequired, true);
  assert.match(recommendation.factors[2].description, /not added again/);
});

test("contract minimum constrains recommendation and temporary inactive users are not automatic removals", () => {
  const record = { ...syntheticLicenseRecords[0], contract_minimum_seats: 430, temporary_inactive_users: 250 };
  const recommendation = calculateLicenseRecommendation(record);
  assert.equal(recommendation.recommendedSeats, 430);
  assert.equal(recommendation.reduction, 70);
  assert.ok(recommendation.constraints.some((constraint) => constraint.includes("250 temporary inactive users")));
  assert.ok(recommendation.constraints.some((constraint) => constraint.includes("not treated as automatic removals")));
});

test("database-shaped license rows use the same deterministic recommendation calculation", () => {
  const recommendations = calculateLicenseRecommendationsFromDatabaseRows(syntheticLicenseRecords);
  assert.equal(recommendations.length, 5);
  assert.equal(recommendations[0].recommendedSeats, 380);
  assert.equal(recommendations[0].humanApprovalRequired, true);
});
