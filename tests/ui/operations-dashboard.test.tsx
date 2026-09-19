import assert from "node:assert/strict";
import test from "node:test";
import { JSDOM } from "jsdom";
import { act } from "react";

test("support-volume chart renders both measured cohorts with labels", async () => {
  const dom = new JSDOM("<!doctype html><html><body><div id='root'></div></body></html>");
  Object.assign(globalThis, {
    window: dom.window,
    document: dom.window.document,
    HTMLElement: dom.window.HTMLElement,
    requestAnimationFrame: (callback: () => void) => callback(),
    IS_REACT_ACT_ENVIRONMENT: true,
  });

  const { createRoot } = await import("react-dom/client");
  const { SupportVolumeChart } = await import("../../components/support-volume-chart");
  const root = createRoot(document.getElementById("root")!);

  try {
    await act(async () => {
      root.render(
        <SupportVolumeChart
          points={[
            { label: "08/15", vdiAuthentication: 3, groupwareAccess: 2 },
            { label: "08/16", vdiAuthentication: 2, groupwareAccess: 1 },
            { label: "08/17", vdiAuthentication: 4, groupwareAccess: 2 },
          ]}
        />,
      );
    });

    assert.equal(document.querySelectorAll(".chart-line").length, 2);
    assert.ok(document.body.textContent?.includes("VDI authentication"));
    assert.ok(document.body.textContent?.includes("Collaboration Platform access"));
    assert.ok(document.body.textContent?.includes("08/15"));
    assert.ok(document.querySelector("svg title")?.textContent?.includes("Daily support volume"));
  } finally {
    await act(async () => {
      root.unmount();
    });
    dom.window.close();
  }
});
