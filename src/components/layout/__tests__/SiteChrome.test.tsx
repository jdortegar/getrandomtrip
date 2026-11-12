import { renderToString } from "react-dom/server";
import { act, Suspense, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SiteChrome } from "../SiteChrome";
import type { Dictionary } from "@/lib/i18n/dictionaries";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

let mockPathname = "/en";
vi.mock("next/navigation", () => ({ usePathname: () => mockPathname }));
vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: null, status: "unauthenticated" }),
}));
vi.mock("@/components/Navbar", () => ({
  default: ({ contained }: { contained?: boolean }) => (
    <div data-contained={String(!!contained)} data-testid="navbar">
      navbar
    </div>
  ),
}));
vi.mock("@/components/layout/Footer", () => ({
  default: () => <div data-testid="footer">footer</div>,
}));

let container: HTMLDivElement;
let root: Root;

function render(banner?: ReactNode) {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root.render(
      <SiteChrome banner={banner} dict={{} as Dictionary} locale="en">
        <div>children</div>
      </SiteChrome>,
    );
  });
  return container;
}

beforeEach(() => {
  mockPathname = "/en";
});

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  vi.unstubAllEnvs();
});

const hasChrome = () => !!container.querySelector('[data-testid="navbar"]');

it("wraps public pages in navbar, main and footer", () => {
  render();
  expect(hasChrome()).toBe(true);
  expect(container.querySelector("main")?.textContent).toBe("children");
  expect(container.querySelector('[data-testid="footer"]')).not.toBeNull();
});

it.each([
  "/en/login",
  "/login",
  "/en/verify-email/token",
  "/reset-password",
  "/en/tripper-invite/t",
  "/invite/t",
  "/en/unsubscribe",
  "/unsubscribe",
])("renders auth utility page %s on its own, without site chrome", (path) => {
  mockPathname = path;
  render();
  expect(hasChrome()).toBe(false);
  expect(container.textContent).toBe("children");
});

it.each([
  ["development", "/en/sentry-example-page", false],
  ["development", "/en/sentry-example-page/other", true],
  ["production", "/en/sentry-example-page", true],
])("Sentry example page chrome: %s %s", (environment, path, chrome) => {
  vi.stubEnv("NODE_ENV", environment);
  mockPathname = path;
  render();
  expect(hasChrome()).toBe(chrome);
});

describe("SiteChrome — banner prop (design ADR-9, tripper-attribution PR3)", () => {
  it("renders the banner just before the chrome", () => {
    render(<div data-testid="attribution-banner">banner</div>);

    const navbar = container.querySelector('[data-testid="navbar"]')!;
    const chrome = navbar.parentElement!;
    expect(navbar.getAttribute("data-contained")).toBe("true");
    expect(chrome.previousElementSibling?.getAttribute("data-testid")).toBe(
      "attribution-banner",
    );
  });

  it("renders nothing extra when no banner prop is passed", () => {
    render(undefined);
    expect(
      container.querySelector('[data-testid="attribution-banner"]'),
    ).toBeNull();
    expect(hasChrome()).toBe(true);
  });

  it("does not reserve banner space when its Suspense content is null", () => {
    render(<Suspense fallback={null}>{null}</Suspense>);
    const navbar = container.querySelector('[data-testid="navbar"]')!;
    expect(navbar.parentElement?.previousElementSibling).toBeNull();
  });
});

it("server renders page content with the chrome, with no session or hydration needed", () => {
  const html = renderToString(
    <SiteChrome dict={{} as Dictionary} locale="en">
      <article>Visible article</article>
    </SiteChrome>,
  );
  expect(html).toContain("Visible article");
  expect(html).toContain('data-testid="navbar"');
});
