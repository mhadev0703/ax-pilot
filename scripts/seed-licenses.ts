import { run } from "./common";
import { syntheticLicenseRecords } from "../lib/analytics/licenses";
import { getSupabase } from "../lib/supabase/server";
import { AppError } from "../lib/errors";

run(async () => {
  const { error } = await getSupabase().from("licenses").upsert(syntheticLicenseRecords, { onConflict: "product" });
  if (error) throw new AppError("LICENSE_SEED_FAILED", "License analytics seed failed. Check the migration and server credentials; no success has been recorded.");
  console.log(JSON.stringify({ seeded: syntheticLicenseRecords.length, dataset: "license-ops-slice-1", synthetic: true }, null, 2));
});
