import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { JSDOM } from "jsdom";
import { act } from "react";

test("workspace supports review, evidence navigation, loading, failure, and abstention", async () => {
  const dom = new JSDOM(
    "<!doctype html><html><body><div id='root'></div></body></html>",
    { url: "http://localhost/investigate" },
  );
  const window = dom.window;
  Object.assign(globalThis, {
    window,
    document: window.document,
    HTMLElement: window.HTMLElement,
    requestAnimationFrame: (callback: () => void) => callback(),
    IS_REACT_ACT_ENVIRONMENT: true,
  });
  Object.defineProperty(globalThis, "navigator", {
    value: window.navigator,
    configurable: true,
  });
  let clipboard = "";
  Object.defineProperty(window.navigator, "clipboard", {
    value: {
      writeText: async (text: string) => {
        clipboard = text;
      },
    },
    configurable: true,
  });
  window.HTMLElement.prototype.scrollIntoView = () => {};
  const { createRoot } = await import("react-dom/client");
  const { InvestigationWorkspace } =
    await import("../../components/investigation-workspace");
  // Captured synthetic live responses are fixtures here; this test never calls providers.
  const fixture = JSON.parse(
    await readFile("tests/fixtures/vdi-investigation.json", "utf8"),
  );
  const negative = JSON.parse(
    await readFile("tests/fixtures/negative-cases.json", "utf8"),
  ).unrelated;
  const originalFetch = globalThis.fetch;
  let requests = 0;
  let complete: ((response: Response) => void) | undefined;
  globalThis.fetch = () => {
    requests++;
    return new Promise<Response>((resolve) => {
      complete = resolve;
    });
  };
  const root = createRoot(document.getElementById("root")!);
  const text = () => document.body.textContent ?? "";
  const button = (label: string) => {
    const found = [...document.querySelectorAll("button")].find((b) =>
      b.textContent?.includes(label),
    );
    assert.ok(found, `Button not found: ${label}`);
    return found;
  };
  const click = async (label: string) => {
    await act(async () => {
      button(label).click();
    });
  };
  const finish = async (body: unknown, status = 200) => {
    assert.ok(complete);
    await act(async () => {
      complete!(
        new Response(JSON.stringify(body), {
          status,
          headers: { "Content-Type": "application/json" },
        }),
      );
    });
  };
  try {
    await act(async () => {
      root.render(<InvestigationWorkspace />);
    });
    assert.equal(requests, 0);
    assert.ok(text().includes("No investigation has run yet"));
    const input = document.querySelector("textarea")!;
    await act(async () => {
      Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")!.set!.call(input, " ");
      input.dispatchEvent(new window.Event("input", { bubbles: true }));
    });
    assert.equal(button("Investigate issue").disabled, true);
    await click("Password reset → VDI");
    await click("Investigate issue");
    assert.ok(text().includes("Reviewing enterprise evidence"));
    assert.equal(button("Investigating").disabled, true);
    await click("Investigating");
    assert.equal(requests, 1);
    await finish(fixture);
    assert.equal(document.querySelectorAll(".evidence-card").length, 4);
    assert.ok(text().includes("Hypothesis"));
    assert.ok(text().includes("Uncalibrated estimate"));
    const filter = document.querySelector("select")!;
    await act(async () => {
      filter.value = "policy";
      filter.dispatchEvent(new window.Event("change", { bubbles: true }));
    });
    assert.equal(document.querySelectorAll(".evidence-card").length, 1);
    await click("INC-1042");
    assert.equal(filter.value, "all");
    assert.ok(document.querySelector("#evidence-INC-1042 .full-source"));
    await click("Copy review summary");
    assert.ok(
      clipboard.includes("SYNTHETIC DEMO") && clipboard.includes("INC-1042"),
    );
    await click("Outside current coverage");
    assert.ok(text().includes("The input has changed"));
    await click("Investigate issue");
    assert.equal(document.querySelectorAll(".analysis-card").length, 0);
    await finish(
      {
        error: { message: "Service unavailable for UI test" },
        requestId: "test-reference",
      },
      503,
    );
    assert.ok(
      document
        .querySelector("[role=alert]")
        ?.textContent?.includes("Service unavailable"),
    );
    assert.equal(document.querySelectorAll(".analysis-card").length, 0);
    await click("Investigate issue");
    await finish(negative);
    assert.ok(text().includes("Evidence is insufficient"));
    assert.ok(text().includes("Escalation required"));
    assert.ok(text().includes("No matching evidence"));
    assert.equal(document.querySelectorAll(".action-list li").length, 0);
  } finally {
    await act(async () => {
      root.unmount();
    });
    globalThis.fetch = originalFetch;
    dom.window.close();
  }
});
