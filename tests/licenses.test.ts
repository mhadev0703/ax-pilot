import assert from "node:assert/strict";
import test from "node:test";
import { calculateLicenseRecommendationsFromDatabaseRows } from "../lib/analytics/database";
import { calculateLicenseRecommendation, syntheticLicenseRecords, syntheticLicenseRecommendations } from "../lib/analytics/licenses";

test("collaboration renewal quantity uses active users, reservations, demand, buffer, and contract floor", () => {
  const recommendation = syntheticLicenseRecommendations[0];
  assert.equal(recommendation.product, "Collaboration Workspace Suite");
  assert.equal(recommendation.utilization, 59.9);
  assert.deepEqual(recommendation.calculation, { demandBase: 504, unconstrainedRecommendation: 535, contractMinimum: 480 });
  assert.equal(recommendation.recommendedSeats, 535);
  assert.equal(recommendation.reduction, 185);
  assert.equal(recommendation.estimatedAnnualSaving, 24_420);
  assert.equal(recommendation.estimatedAnnualSavingLabel, "$24,420");
  assert.equal(recommendation.risk, "Medium");
  assert.equal(recommendation.humanApprovalRequired, true);
  assert.match(recommendation.factors[2].description, /not added again/);
});

test("contract minimum constrains recommendation and temporary inactive users are not automatic removals", () => {
  const record = { ...syntheticLicenseRecords[0], contract_minimum_seats: 560, temporary_inactive_users: 250 };
  const recommendation = calculateLicenseRecommendation(record);
  assert.equal(recommendation.recommendedSeats, 560);
  assert.equal(recommendation.reduction, 160);
  assert.ok(recommendation.constraints.some((constraint) => constraint.includes("250 temporary inactive users")));
  assert.ok(recommendation.constraints.some((constraint) => constraint.includes("not treated as automatic removals")));
});

test("database-shaped license rows use the same deterministic recommendation calculation", () => {
  const recommendations = calculateLicenseRecommendationsFromDatabaseRows(syntheticLicenseRecords);
  assert.equal(recommendations.length, 5);
  assert.equal(recommendations[0].recommendedSeats, 535);
  assert.equal(recommendations[0].humanApprovalRequired, true);
});
