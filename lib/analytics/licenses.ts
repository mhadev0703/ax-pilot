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

export const syntheticLicenseRecords: LicenseRecord[] = [
  { product: "Enterprise Collaboration Suite", contracted_seats: 500, active_users_30d: 287, active_users_90d: 302, reserved_seats: 23, upcoming_demand: 35, temporary_inactive_users: 16, department_survey_demand: 12, annual_unit_cost: 144, annual_cost: 72_000, renewal_date: "2026-12-01", contract_minimum_seats: 350, recommended_buffer: 20, contract_change_allowed: true, synthetic: true },
  { product: "VDI Standard", contracted_seats: 940, active_users_30d: 811, active_users_90d: 846, reserved_seats: 41, upcoming_demand: 38, temporary_inactive_users: 29, department_survey_demand: 18, annual_unit_cost: 216, annual_cost: 203_040, renewal_date: "2026-12-15", contract_minimum_seats: 800, recommended_buffer: 35, contract_change_allowed: true, synthetic: true },
  { product: "Engineering Design Add-on", contracted_seats: 180, active_users_30d: 159, active_users_90d: 166, reserved_seats: 8, upcoming_demand: 11, temporary_inactive_users: 7, department_survey_demand: 5, annual_unit_cost: 420, annual_cost: 75_600, renewal_date: "2027-03-01", contract_minimum_seats: 160, recommended_buffer: 10, contract_change_allowed: true, synthetic: true },
  { product: "Secure Print Management", contracted_seats: 1_900, active_users_30d: 1_615, active_users_90d: 1_672, reserved_seats: 80, upcoming_demand: 54, temporary_inactive_users: 61, department_survey_demand: 30, annual_unit_cost: 24, annual_cost: 45_600, renewal_date: "2026-11-01", contract_minimum_seats: 1_700, recommended_buffer: 65, contract_change_allowed: false, synthetic: true },
  { product: "Internal Mobile App Distribution", contracted_seats: 650, active_users_30d: 512, active_users_90d: 548, reserved_seats: 34, upcoming_demand: 30, temporary_inactive_users: 25, department_survey_demand: 17, annual_unit_cost: 72, annual_cost: 46_800, renewal_date: "2027-01-10", contract_minimum_seats: 600, recommended_buffer: 25, contract_change_allowed: true, synthetic: true },
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
  const daysUntilRenewal = Math.ceil((new Date(`${record.renewal_date}T00:00:00Z`).getTime() - new Date("2026-09-14T00:00:00Z").getTime()) / 86_400_000);
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
