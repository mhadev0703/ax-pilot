import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import { act } from "react";

test("license review changes only local review state and never presents an execution action", async () => {
  const dom = new JSDOM("<!doctype html><html><body><div id='root'></div></body></html>", { url: "http://localhost/optimization" });
  const window = dom.window;
  Object.assign(globalThis, { window, document: window.document, HTMLElement: window.HTMLElement, IS_REACT_ACT_ENVIRONMENT: true });
  const { createRoot } = await import("react-dom/client");
  const { LicenseOptimization } = await import("../../components/license-optimization");
  const root = createRoot(document.getElementById("root")!);
  const text = () => document.body.textContent ?? "";
  const button = (label: string) => {
    const found = [...document.querySelectorAll("button")].find((element) => element.textContent?.includes(label));
    assert.ok(found, `Button not found: ${label}`);
    return found;
  };
  try {
    await act(async () => { root.render(<LicenseOptimization />); });
    assert.ok(text().includes("380 seats"));
    assert.ok(text().includes("$17,280"));
    assert.ok(text().includes("Human approval required"));
    assert.equal([...document.querySelectorAll("button")].some((element) => /execute|remove licenses|change contract/i.test(element.textContent ?? "")), false);
    await act(async () => { button("Approve for review").click(); });
    assert.ok(text().includes("Approved for external review"));
    assert.ok(text().includes("No contract or license operation was performed"));
    await act(async () => { button("VDI Standard").click(); });
    assert.ok(text().includes("VDI Standard"));
    assert.ok(text().includes("Awaiting human review"));
    await act(async () => { button("Reject").click(); });
    assert.ok(text().includes("Rejected — no action taken"));
    assert.ok(text().includes("No contract or license operation was performed"));
  } finally {
    await act(async () => { root.unmount(); });
    dom.window.close();
  }
});
