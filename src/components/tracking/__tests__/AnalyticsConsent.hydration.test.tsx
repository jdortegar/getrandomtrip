import { act, useLayoutEffect } from "react";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import AnalyticsConsent from "../AnalyticsConsent";
import {
  CONSENT_EVENT,
  CONSENT_KEY,
  readAnalyticsConsent,
  saveAnalyticsConsent,
} from "@/lib/helpers/tracking/consent";
import { useAnalyticsPreferencesStore } from "@/store/slices/analyticsPreferencesStore";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";

const locales = [
  { copy: en.analyticsConsent, locale: "en" },
  { copy: es.analyticsConsent, locale: "es" },
];
const selector = '[aria-labelledby="analytics-consent-title"]';
(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root | undefined;
let container: HTMLDivElement;

beforeEach(() => {
  useAnalyticsPreferencesStore.setState({ open: false });
  const values = new Map<string, string>();
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    value: {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    },
  });
  container = document.createElement("div");
  document.body.appendChild(container);
});

afterEach(() => {
  act(() => root?.unmount());
  root = undefined;
  container.remove();
  vi.restoreAllMocks();
});

it.each(locales)(
  "omits unresolved consent from server HTML without reading browser storage: $locale",
  ({ copy }) => {
    const getItem = vi.spyOn(window.localStorage, "getItem");
    expect(renderToString(<AnalyticsConsent copy={copy} />)).toBe("");
    expect(getItem).not.toHaveBeenCalled();
  },
);

it.each(
  locales.flatMap(({ copy, locale }) =>
    (["granted", "denied", null] as const).map((consent) => ({
      copy,
      locale,
      consent,
    })),
  ),
)(
  "keeps SSR and the first hydration commit hidden, then resolves $consent consent: $locale",
  async ({ copy, consent }) => {
    if (consent) window.localStorage.setItem(CONSENT_KEY, consent);
    const firstCommit: boolean[] = [];
    function HydrationProbe() {
      useLayoutEffect(() => {
        firstCommit.push(container.querySelector(selector) !== null);
      }, []);
      return <AnalyticsConsent copy={copy} />;
    }
    const view = <HydrationProbe />;
    container.innerHTML = renderToString(view);
    const serverHasPrompt = container.querySelector(selector) !== null;
    const onRecoverableError = vi.fn();
    const addedPrompts: Node[] = [];
    const recordPrompts = (records: MutationRecord[]) => {
      for (const { addedNodes } of records) {
        for (const node of addedNodes) {
          if (
            node instanceof Element &&
            (node.matches(selector) || node.querySelector(selector))
          ) {
            addedPrompts.push(node);
          }
        }
      }
    };
    const observer = new MutationObserver(recordPrompts);
    observer.observe(container, { childList: true, subtree: true });
    try {
      await act(async () => {
        root = hydrateRoot(container, view, { onRecoverableError });
      });
      recordPrompts(observer.takeRecords());
      expect(serverHasPrompt).toBe(false);
      expect(firstCommit).toEqual([false]);
      expect(onRecoverableError).not.toHaveBeenCalled();
      if (consent) {
        expect(container.querySelector(selector)).toBeNull();
        expect(addedPrompts).toEqual([]);
      } else {
        expect(container.querySelector(selector)?.getAttribute("role")).toBe(
          "region",
        );
        expect(container.textContent).toContain(copy.title);
        expect(container.textContent).toContain(copy.accept);
        expect(container.textContent).toContain(copy.reject);
        expect(container.querySelectorAll("button")).toHaveLength(2);
      }
      expect(readAnalyticsConsent()).toBe(consent);
    } finally {
      observer.disconnect();
    }
  },
);

it("continues reacting to cross-tab and same-tab consent changes after hydration", async () => {
  const view = <AnalyticsConsent copy={en.analyticsConsent} />;
  window.localStorage.setItem(CONSENT_KEY, "denied");
  container.innerHTML = renderToString(view);
  await act(async () => {
    root = hydrateRoot(container, view);
  });
  expect(container.querySelector(selector)).toBeNull();
  act(() => {
    window.localStorage.removeItem(CONSENT_KEY);
    window.dispatchEvent(new StorageEvent("storage", { key: CONSENT_KEY }));
  });
  expect(container.querySelector(selector)).not.toBeNull();
  act(() => saveAnalyticsConsent("granted"));
  expect(container.querySelector(selector)).toBeNull();
  act(() => {
    window.localStorage.removeItem(CONSENT_KEY);
    window.dispatchEvent(new Event(CONSENT_EVENT));
  });
  expect(container.querySelector(selector)).not.toBeNull();
});

it("resolves blocked storage to an unanswered prompt rather than assuming permission", async () => {
  vi.spyOn(window.localStorage, "getItem").mockImplementation(() => {
    throw new Error("Storage blocked");
  });
  const view = <AnalyticsConsent copy={en.analyticsConsent} />;
  container.innerHTML = renderToString(view);
  await act(async () => {
    root = hydrateRoot(container, view);
  });
  expect(container.querySelector(selector)).not.toBeNull();
  expect(container.querySelectorAll("button")).toHaveLength(2);
  expect(readAnalyticsConsent()).toBeNull();
});
