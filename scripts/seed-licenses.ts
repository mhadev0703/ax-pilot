import { run } from "./common";
import { syntheticLicenseRecords } from "../lib/analytics/licenses";
import { getSupabase } from "../lib/supabase/server";
import { AppError } from "../lib/errors";

run(async () => {
  // Product labels can change between synthetic slices, so remove only demo rows first.
  const { error: deleteError } = await getSupabase().from("licenses").delete().eq("synthetic", true);
  if (deleteError) throw new AppError("LICENSE_SEED_FAILED", "Synthetic license reset failed. Check server credentials and table access.");
  const { error } = await getSupabase().from("licenses").upsert(syntheticLicenseRecords, { onConflict: "product" });
  if (error) throw new AppError("LICENSE_SEED_FAILED", "License analytics seed failed. Check the migration and server credentials; no success has been recorded.");
  console.log(JSON.stringify({ seeded: syntheticLicenseRecords.length, dataset: "license-ops-slice-2", synthetic: true }, null, 2));
});
