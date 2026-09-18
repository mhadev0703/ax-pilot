import { LicenseOptimization } from "@/components/license-optimization";
import { getLicenseRecommendationsFromDatabase } from "@/lib/analytics/database";

export const dynamic = "force-dynamic";

export default async function OptimizationPage() {
  const recommendations = await getLicenseRecommendationsFromDatabase();
  return <LicenseOptimization recommendations={recommendations} />;
}
