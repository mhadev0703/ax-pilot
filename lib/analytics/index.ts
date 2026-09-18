import "server-only";
import { calculateTicketAnalytics, syntheticSupportTickets } from "./tickets";

// The first operational dataset is local synthetic source data so the dashboard is
// reproducible before a database seed. scripts/seed-tickets.ts persists these same rows.
export function getTicketAnalytics() {
  return calculateTicketAnalytics(syntheticSupportTickets);
}
