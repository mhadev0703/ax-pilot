import { NextResponse } from "next/server";
import { getLicenseRecommendations } from "@/lib/analytics/licenses-server";

export const runtime = "nodejs";
export async function GET() { return NextResponse.json({ synthetic: true, datasetVersion: "license-ops-slice-1", generatedAt: "2026-09-14T00:00:00.000Z", recommendations: getLicenseRecommendations() }, { headers: { "Cache-Control": "no-store" } }); }
