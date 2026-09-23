import { afterEach, beforeEach, describe, expect, it } from "vitest";
import TripperTopbar from "../TripperTopbar";
import {
  createDomHarness,
  type DomHarness,
} from "@/components/ui/__tests__/test-dom-utils";

let harness: DomHarness;
let previousUrl: string;
beforeEach(() => {
  previousUrl = window.location.href;
  harness = createDomHarness();
});
afterEach(() => {
  harness.unmount();
  window.history.replaceState(null, "", previousUrl);
});

describe("TripperTopbar navigation", () => {
  it.each(["/dashboard/tripper", "/en/dashboard/tripper"])(
    "preserves the existing create-route destination and name from %s",
    (pathname) => {
      window.history.replaceState(null, "", pathname);
      harness.render(<TripperTopbar />);
      const links = harness.container.querySelectorAll("a");
      expect(links).toHaveLength(1);
      const link = links[0];
      expect(link.getAttribute("href")).toBe("/dashboard/tripper/packages/new");
      expect(link.textContent).toBe("Crear Ruta");
      expect(link.target).toBe("");
      expect(link.tabIndex).toBe(0);
      link.focus();
      expect(document.activeElement).toBe(link);
      expect(harness.container.querySelector("input")?.placeholder).toBe(
        "Buscar...",
      );
    },
  );
});
