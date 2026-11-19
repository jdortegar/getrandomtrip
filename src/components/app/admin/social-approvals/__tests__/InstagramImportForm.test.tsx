import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, expect, it, vi } from "vitest";
import en from "@/dictionaries/en.json";
import { InstagramImportForm } from "../InstagramImportForm";
vi.mock("@/components/ui/FormField", () => ({
  FormField: () => null,
  FormSelectField: () => null,
}));
vi.mock("@/components/ui/TextAreaInput", () => ({ TextAreaInput: () => null }));
(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
afterEach(() => vi.unstubAllGlobals());
it.each([true, false])(
  "checks the Spanish queue without importing; success=%s",
  async (ok) => {
    const container = document.createElement("div");
    const root = createRoot(container);
    let finish!: (response: Response) => void;
    const fetcher = vi.fn().mockReturnValue(
      new Promise<Response>((resolve) => {
        finish = resolve;
      }),
    );
    vi.stubGlobal("fetch", fetcher);
    act(() => root.render(<InstagramImportForm copy={en.socialImport} />));
    const button = [...container.querySelectorAll("button")].find(
      (node) => node.textContent === en.socialImport.check,
    )!;
    try {
      act(() => {
        button.click();
        button.click();
      });
      expect(button.disabled).toBe(true);
      expect(button.getAttribute("aria-busy")).toBe("true");
      expect(button.textContent).toBe(en.socialImport.checking);
      expect(button.querySelector("svg")).not.toBeNull();
      expect(fetcher).toHaveBeenCalledOnce();
      expect(fetcher).toHaveBeenCalledWith(
        "/api/admin/social-approvals/sources",
        expect.objectContaining({ method: "POST", body: "{}" }),
      );
      await act(async () => {
        finish(
          Response.json(
            { reason: "IN_PROGRESS", error: "private" },
            { status: ok ? 200 : 503 },
          ),
        );
      });
      expect(button.disabled).toBe(false);
      expect(button.getAttribute("aria-busy")).toBe("false");
      expect(
        container.querySelector(ok ? '[role="status"]' : '[role="alert"]')
          ?.textContent,
      ).toBe(ok ? en.socialImport.checked : en.socialImport.checkError);
      expect(container.textContent).not.toContain("private");
      if (!ok) {
        await act(async () => button.click());
        expect(fetcher).toHaveBeenCalledTimes(2);
      }
    } finally {
      act(() => root.unmount());
    }
  },
);
