import assert from "node:assert/strict";
import test from "node:test";
import { POST } from "../app/api/investigate/route";

const request = (body: string, type = "application/json") => new Request("http://localhost/api/investigate", { method: "POST", headers: { "content-type": type }, body });

test("API rejects malformed JSON and wrong content type", async () => {
  assert.equal((await POST(request("{"))).status, 400);
  assert.equal((await POST(request("hello", "text/plain"))).status, 415);
});

test("API rejects oversized bodies without relying on Content-Length", async () => {
  assert.equal((await POST(request(JSON.stringify({ question: "a".repeat(13_000) })))).status, 413);
});

test("API rejects invalid question before attempting a service call", async () => {
  assert.equal((await POST(request('{"question":""}'))).status, 400);
});

test("API reports missing config as 503 with no synthetic success fallback", async () => {
  const previous = process.env.OPENAI_API_KEY;
  delete process.env.OPENAI_API_KEY;
  try {
    const response = await POST(request('{"question":"I reset my password and cannot access VDI."}'));
    assert.equal(response.status, 503);
    assert.equal(response.headers.get("cache-control"), "no-store");
    const body = await response.json();
    assert.equal(body.error.code, "CONFIGURATION_REQUIRED");
    assert.equal(body.result, undefined);
  } finally {
    if (previous !== undefined) process.env.OPENAI_API_KEY = previous;
  }
});
