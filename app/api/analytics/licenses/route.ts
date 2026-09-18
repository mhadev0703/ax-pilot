import { NextResponse } from "next/server";
import { getLicenseRecommendationsFromDatabase } from "@/lib/analytics/database";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(
    {
      synthetic: true,
      datasetVersion: "license-ops-slice-1",
      generatedAt: "2026-09-14T00:00:00.000Z",
      recommendations: await getLicenseRecommendationsFromDatabase(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
