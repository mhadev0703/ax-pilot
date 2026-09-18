import "server-only";

import { z } from "zod";
import { AppError } from "@/lib/errors";
import { getSupabase } from "@/lib/supabase/server";
import { calculateLicenseRecommendation, type LicenseRecord } from "./licenses";
import { calculateTicketAnalytics, type SupportTicket } from "./tickets";

const ticketSchema = z.object({
  ticket_id: z.string().startsWith("SYN-"),
  created_at: z.string().datetime({ offset: true }),
  system: z.enum(["VDI", "Groupware", "Provisioning", "Collaboration", "Device Lifecycle", "Printing"]),
  category: z.enum(["Authentication", "Access", "Provisioning", "Application Support", "Device Support", "Print Service"]),
  department: z.string(),
  password_reset_related: z.boolean(),
  is_repeat_contact: z.boolean(),
  ai_assisted: z.boolean(),
  provisioning_delay: z.boolean(),
  synthetic: z.literal(true),
});

const licenseSchema = z.object({
  product: z.string(),
  contracted_seats: z.number().int().positive(),
  active_users_30d: z.number().int().nonnegative(),
  active_users_90d: z.number().int().nonnegative(),
  reserved_seats: z.number().int().nonnegative(),
  upcoming_demand: z.number().int().nonnegative(),
  temporary_inactive_users: z.number().int().nonnegative(),
  department_survey_demand: z.number().int().nonnegative(),
  annual_unit_cost: z.number().nonnegative(),
  annual_cost: z.number().nonnegative(),
  renewal_date: z.string().date(),
  contract_minimum_seats: z.number().int().positive(),
  recommended_buffer: z.number().int().nonnegative(),
  contract_change_allowed: z.boolean(),
  synthetic: z.literal(true),
});

// DB stores structured synthetic inputs; calculations remain deterministic code.
// Exported separately so offline tests can validate the same DB-row boundary.
export function calculateTicketAnalyticsFromDatabaseRows(data: unknown) {
  const parsed = z.array(ticketSchema).safeParse(data);
  if (!parsed.success) throw new AppError("TICKET_ANALYTICS_DATA_INVALID", "Ticket analytics data failed validation.", 503);
  return calculateTicketAnalytics(parsed.data as SupportTicket[]);
}

export async function getTicketAnalyticsFromDatabase() {
  const { data, error } = await getSupabase()
    .from("support_tickets")
    .select("ticket_id, created_at, system, category, department, password_reset_related, is_repeat_contact, ai_assisted, provisioning_delay, synthetic")
    .eq("synthetic", true)
    .order("created_at", { ascending: true });
  if (error) throw new AppError("TICKET_ANALYTICS_READ_FAILED", "Ticket analytics data could not be loaded.", 503);

  return calculateTicketAnalyticsFromDatabaseRows(data);
}

export function calculateLicenseRecommendationsFromDatabaseRows(data: unknown) {
  const parsed = z.array(licenseSchema).safeParse(data);
  if (!parsed.success) throw new AppError("LICENSE_ANALYTICS_DATA_INVALID", "License analytics data failed validation.", 503);
  return parsed.data.map((record) => calculateLicenseRecommendation(record as LicenseRecord));
}

export async function getLicenseRecommendationsFromDatabase() {
  const { data, error } = await getSupabase()
    .from("licenses")
    .select("product, contracted_seats, active_users_30d, active_users_90d, reserved_seats, upcoming_demand, temporary_inactive_users, department_survey_demand, annual_unit_cost, annual_cost, renewal_date, contract_minimum_seats, recommended_buffer, contract_change_allowed, synthetic")
    .eq("synthetic", true)
    .order("product", { ascending: true });
  if (error) throw new AppError("LICENSE_ANALYTICS_READ_FAILED", "License analytics data could not be loaded.", 503);

  return calculateLicenseRecommendationsFromDatabaseRows(data);
}
