import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { FieldMeta } from "../FieldMeta";
import { createDomHarness, type DomHarness } from "./test-dom-utils";

let harness: DomHarness;

beforeEach(() => {
  harness = createDomHarness();
});

afterEach(() => {
  harness.unmount();
});

describe("FieldMeta", () => {
  it("renders nothing without a hint or counter", () => {
    harness.render(<FieldMeta />);
    expect(harness.container.innerHTML).toBe("");
  });

  it("shows the hint and the counter", () => {
    harness.render(<FieldMeta count={{ length: 11, max: 40 }} hint="Tu nombre" />);
    expect(harness.container.textContent).toContain("Tu nombre");
    expect(harness.container.textContent).toContain("11 / 40");
  });

  it("marks a value over the limit", () => {
    harness.render(<FieldMeta count={{ length: 41, max: 40 }} />);
    expect(harness.container.querySelector(".text-red-700")?.textContent).toBe("41 / 40");
  });
});
