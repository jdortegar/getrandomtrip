import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getAutoSelectedExcuse,
  useJourneyAutoExcuse,
} from "../useJourneyAutoExcuse";

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

describe("getAutoSelectedExcuse", () => {
  it("returns the only excuse when none is selected", () => {
    expect(getAutoSelectedExcuse(true, ["family-adventure"], undefined)).toBe(
      "family-adventure",
    );
  });

  it("returns null when disabled, already selected or several excuses exist", () => {
    expect(getAutoSelectedExcuse(false, ["a"], undefined)).toBeNull();
    expect(getAutoSelectedExcuse(true, ["a"], "a")).toBeNull();
    expect(getAutoSelectedExcuse(true, ["a", "b"], undefined)).toBeNull();
    expect(getAutoSelectedExcuse(true, [], undefined)).toBeNull();
  });
});

function Probe(props: Parameters<typeof useJourneyAutoExcuse>[0]) {
  useJourneyAutoExcuse(props);
  return null;
}

describe("useJourneyAutoExcuse", () => {
  const roots: Root[] = [];
  afterEach(() => roots.splice(0).forEach((root) => act(() => root.unmount())));

  function mount(props: Parameters<typeof useJourneyAutoExcuse>[0]) {
    const root = createRoot(document.createElement("div"));
    roots.push(root);
    act(() => root.render(<Probe {...props} />));
    return root;
  }

  it("selects the single excuse once", () => {
    const onSelect = vi.fn();
    const root = mount({
      enabled: true,
      excuseKeys: ["paws-adventure"],
      selectedExcuse: undefined,
      onSelect,
    });
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith("paws-adventure");
    act(() =>
      root.render(
        <Probe
          enabled
          excuseKeys={["paws-adventure"]}
          selectedExcuse="paws-adventure"
          onSelect={onSelect}
        />,
      ),
    );
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("does not select when there are several excuses", () => {
    const onSelect = vi.fn();
    mount({
      enabled: true,
      excuseKeys: ["a", "b"],
      selectedExcuse: undefined,
      onSelect,
    });
    expect(onSelect).not.toHaveBeenCalled();
  });
});
