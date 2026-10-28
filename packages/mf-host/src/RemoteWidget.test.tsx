import { act, type ComponentType } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { RemoteWidget } from "./RemoteWidget";

const loadRemote = vi.fn<(id: string) => Promise<unknown>>();

vi.mock("./runtime", () => ({ getFederation: () => ({ loadRemote }) }));

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  loadRemote.mockReset();
  vi.restoreAllMocks();
});

function serve(modules: Record<string, ComponentType | "pending">) {
  loadRemote.mockImplementation((id) => {
    const widget = modules[id];
    if (widget === "pending") return new Promise(() => {});
    return Promise.resolve({ default: widget });
  });
}

function Exploding(): never {
  throw new Error("widget render failed");
}

test("a widget that throws while rendering shows the fallback and keeps its siblings", async () => {
  serve({ "widgets/CartWidget": Exploding });
  await act(async () => {
    root.render(
      <>
        <h1>Zone page</h1>
        <RemoteWidget name="CartWidget" />
      </>,
    );
  });
  expect(container.querySelector("h1")?.textContent).toBe("Zone page");
  expect(
    container.querySelector('[data-testid="widget-fallback"]')?.textContent,
  ).toBe("Widget unavailable");
});

test("changing the name drops the previous widget while the next one loads", async () => {
  serve({
    "widgets/CartWidget": () => <p>cart widget</p>,
    "widgets/Recommendations": "pending",
  });
  await act(async () => root.render(<RemoteWidget name="CartWidget" />));
  expect(container.textContent).toBe("cart widget");

  await act(async () => root.render(<RemoteWidget name="Recommendations" />));
  expect(container.textContent).toBe("");
});

test("a failed widget does not keep the fallback after the name changes", async () => {
  serve({
    "widgets/CartWidget": Exploding,
    "widgets/Recommendations": () => <p>recommendations widget</p>,
  });
  await act(async () => root.render(<RemoteWidget name="CartWidget" />));
  expect(container.textContent).toBe("Widget unavailable");

  await act(async () => root.render(<RemoteWidget name="Recommendations" />));
  expect(container.textContent).toBe("recommendations widget");
});

test("an unavailable remote shows the fallback and logs a warning, not an error", async () => {
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
  const error = vi.mocked(console.error);
  loadRemote.mockRejectedValue(new Error("Failed to get manifest"));
  await act(async () => root.render(<RemoteWidget name="CartWidget" />));
  expect(container.textContent).toBe("Widget unavailable");
  expect(warn).toHaveBeenCalledTimes(1);
  expect(error).not.toHaveBeenCalled();
});
