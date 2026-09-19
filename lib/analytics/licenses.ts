export type LicenseRecord = {
  product: string;
  contracted_seats: number;
  active_users_30d: number;
  active_users_90d: number;
  reserved_seats: number;
  upcoming_demand: number;
  temporary_inactive_users: number;
  department_survey_demand: number;
  annual_unit_cost: number;
  annual_cost: number;
  renewal_date: string;
  contract_minimum_seats: number;
  recommended_buffer: number;
  contract_change_allowed: boolean;
  synthetic: true;
};

// Canonical local source for seed scripts and offline tests. Runtime analytics
// reads the equivalent synthetic rows from Supabase through database.ts.
export const syntheticLicenseRecords: LicenseRecord[] = [
  { product: "Collaboration Workspace Suite", contracted_seats: 720, active_users_30d: 414, active_users_90d: 431, reserved_seats: 29, upcoming_demand: 44, temporary_inactive_users: 22, department_survey_demand: 15, annual_unit_cost: 132, annual_cost: 95_040, renewal_date: "2027-08-15", contract_minimum_seats: 480, recommended_buffer: 31, contract_change_allowed: true, synthetic: true },
  { product: "Remote Workspace Access", contracted_seats: 680, active_users_30d: 542, active_users_90d: 574, reserved_seats: 32, upcoming_demand: 27, temporary_inactive_users: 21, department_survey_demand: 9, annual_unit_cost: 168, annual_cost: 114_240, renewal_date: "2027-09-01", contract_minimum_seats: 520, recommended_buffer: 26, contract_change_allowed: true, synthetic: true },
  { product: "Project Planning Add-on", contracted_seats: 245, active_users_30d: 171, active_users_90d: 189, reserved_seats: 14, upcoming_demand: 18, temporary_inactive_users: 9, department_survey_demand: 7, annual_unit_cost: 276, annual_cost: 67_620, renewal_date: "2027-10-01", contract_minimum_seats: 190, recommended_buffer: 19, contract_change_allowed: true, synthetic: true },
  { product: "Document Workflow Service", contracted_seats: 1_140, active_users_30d: 784, active_users_90d: 823, reserved_seats: 57, upcoming_demand: 69, temporary_inactive_users: 38, department_survey_demand: 22, annual_unit_cost: 36, annual_cost: 41_040, renewal_date: "2027-07-15", contract_minimum_seats: 900, recommended_buffer: 48, contract_change_allowed: false, synthetic: true },
  { product: "Managed Device Services", contracted_seats: 410, active_users_30d: 281, active_users_90d: 306, reserved_seats: 18, upcoming_demand: 25, temporary_inactive_users: 14, department_survey_demand: 11, annual_unit_cost: 96, annual_cost: 39_360, renewal_date: "2027-11-15", contract_minimum_seats: 320, recommended_buffer: 22, contract_change_allowed: true, synthetic: true },
];

function currency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

export function calculateLicenseRecommendation(record: LicenseRecord) {
  // Upcoming demand already includes validated survey demand, so never add survey demand twice.
  const demandBase = record.active_users_90d + record.reserved_seats + record.upcoming_demand;
  const unconstrainedRecommendation = demandBase + record.recommended_buffer;
  const recommendedSeats = Math.max(record.contract_minimum_seats, unconstrainedRecommendation);
  const reduction = Math.max(record.contracted_seats - recommendedSeats, 0);
  const estimatedAnnualSaving = reduction * record.annual_unit_cost;
  const utilization = Math.round((record.active_users_90d / record.contracted_seats) * 1000) / 10;
  const daysUntilRenewal = Math.ceil((new Date(`${record.renewal_date}T00:00:00Z`).getTime() - new Date(ANALYTICS_ANCHOR_DATE).getTime()) / 86_400_000);
  const risk = record.contract_change_allowed && daysUntilRenewal >= 30 && reduction > record.recommended_buffer ? "Medium" : "High";
  return {
    product: record.product,
    currentSeats: record.contracted_seats,
    annualCost: record.annual_cost,
    activeUsers90d: record.active_users_90d,
    utilization,
    renewalDate: record.renewal_date,
    daysUntilRenewal,
    recommendedSeats,
    reduction,
    estimatedAnnualSaving,
    estimatedAnnualSavingLabel: currency(estimatedAnnualSaving),
    risk,
    humanApprovalRequired: true as const,
    factors: [
      { label: "90-day active users", value: record.active_users_90d, description: "Counts users active in the stated 90-day measurement window." },
      { label: "Reserved seats", value: record.reserved_seats, description: "Held for approved operational roles." },
      { label: "Upcoming demand", value: record.upcoming_demand, description: `Includes ${record.department_survey_demand} validated department-survey requests; not added again.` },
      { label: "Operational buffer", value: record.recommended_buffer, description: "Explicit buffer for demand uncertainty." },
    ],
    constraints: [
      `Contract minimum: ${record.contract_minimum_seats} seats`,
      record.contract_change_allowed ? "Quantity change permitted at renewal, subject to human approval." : "Contract amendment required; no quantity change is assumed.",
      `${record.temporary_inactive_users} temporary inactive users are included in the 90-day active measure where applicable; they are not treated as automatic removals.`,
    ],
    calculation: { demandBase, unconstrainedRecommendation, contractMinimum: record.contract_minimum_seats },
  };
}

export const syntheticLicenseRecommendations = syntheticLicenseRecords.map(calculateLicenseRecommendation);
import { ANALYTICS_ANCHOR_DATE } from "./tickets";
