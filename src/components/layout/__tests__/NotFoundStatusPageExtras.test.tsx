import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, expect, it, vi } from "vitest";
import es from "@/dictionaries/es.json";
import type { MarketingDictionary } from "@/lib/types/dictionary";
import { NotFoundStatusExploreAndTip } from "../NotFoundStatusPageExtras";

const nf = es.notFound as MarketingDictionary["notFound"];

afterEach(() => vi.unstubAllEnvs());

function render() {
  return renderToStaticMarkup(<NotFoundStatusExploreAndTip locale="es" nf={nf} />);
}

it("hides the trippers link in production", () => {
  vi.stubEnv("NEXT_PUBLIC_RT_DEPLOY_ENV", "production");
  const html = render();
  expect(html).not.toContain('href="/trippers"');
  expect(html).toContain('href="/experiences/by-type/solo"');
});

it("shows the trippers link in nonproduction", () => {
  vi.stubEnv("NEXT_PUBLIC_RT_DEPLOY_ENV", "nonproduction");
  expect(render()).toContain('href="/trippers"');
});
