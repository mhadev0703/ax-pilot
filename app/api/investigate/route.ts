import { NextResponse } from "next/server";
import { AppError, publicError } from "@/lib/errors";
import { investigationInputSchema } from "@/lib/rag/schema";
import { investigate } from "@/lib/workflows/investigate";

export const runtime = "nodejs";

async function readBoundedJson(request: Request): Promise<unknown> {
  if (!request.headers.get("content-type")?.includes("application/json")) throw new AppError("INVALID_CONTENT_TYPE", "Send application/json.", 415);
  const reader = request.body?.getReader();
  if (!reader) throw new AppError("INVALID_REQUEST", "A JSON request body is required.", 400);
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 12_000) {
        await reader.cancel();
        throw new AppError("REQUEST_TOO_LARGE", "The request body is too large.", 413);
      }
      chunks.push(value);
    }
    try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); }
    catch { throw new AppError("INVALID_JSON", "Send valid JSON.", 400); }
  } finally { reader.releaseLock(); }
}

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  try {
    const parsed = investigationInputSchema.safeParse(await readBoundedJson(request));
    if (!parsed.success) throw new AppError("INVALID_REQUEST", "Provide only a question containing 8–2,000 characters.", 400);
    return NextResponse.json(await investigate(parsed.data), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const safe = publicError(error);
    console.error(JSON.stringify({ event: "investigation_failed", requestId, code: safe.code }));
    return NextResponse.json({ error: { code: safe.code, message: safe.message }, requestId }, { status: safe.status, headers: { "Cache-Control": "no-store" } });
  }
}
