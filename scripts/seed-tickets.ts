import { run } from "./common";
import { syntheticSupportTickets } from "../lib/analytics/tickets";
import { getSupabase } from "../lib/supabase/server";
import { AppError } from "../lib/errors";

run(async () => {
  // This demo dataset is regenerated as a complete synthetic cohort on every seed.
  const { error: deleteError } = await getSupabase()
    .from("support_tickets")
    .delete()
    .eq("synthetic", true);
  if (deleteError) throw new AppError("TICKET_SEED_FAILED", "Synthetic ticket reset failed. Check server credentials and table access.");
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
        dataset: "ticket-ops-slice-2",
        synthetic: true,
      },
      null,
      2,
    ),
  );
});
