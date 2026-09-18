import { run } from "./common";
import { syntheticSupportTickets } from "../lib/analytics/tickets";
import { getSupabase } from "../lib/supabase/server";
import { AppError } from "../lib/errors";

run(async () => {
  const { error } = await getSupabase()
    .from("support_tickets")
    .upsert(syntheticSupportTickets, { onConflict: "ticket_id" });
  if (error)
    throw new AppError(
      "TICKET_SEED_FAILED",
      "Ticket analytics seed failed. Check the migration and server credentials; no success has been recorded.",
    );
  console.log(
    JSON.stringify(
      {
        seeded: syntheticSupportTickets.length,
        dataset: "ticket-ops-slice-1",
        synthetic: true,
      },
      null,
      2,
    ),
  );
});
