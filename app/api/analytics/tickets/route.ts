import { NextResponse } from "next/server";
import { getTicketAnalytics } from "@/lib/analytics";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(getTicketAnalytics(), {
    headers: { "Cache-Control": "no-store" },
  });
}
