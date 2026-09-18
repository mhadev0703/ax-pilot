import { NextResponse } from "next/server";
import { getTicketAnalyticsFromDatabase } from "@/lib/analytics/database";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(await getTicketAnalyticsFromDatabase(), {
    headers: { "Cache-Control": "no-store" },
  });
}
