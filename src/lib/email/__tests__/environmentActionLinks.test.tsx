import { afterEach, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import BlogApproved from "@/emails/BlogApproved";
import TripCompleted from "@/emails/TripCompleted";

afterEach(() => vi.unstubAllEnvs());

it("resolves transactional links at render time, not module import time", () => {
  const origin = "https://deploy-preview-304--getrandomtrip-1.netlify.app";
  vi.stubEnv("RT_DEPLOY_ENV", "nonproduction");
  vi.stubEnv("NEXT_PUBLIC_RT_SITE_NAME", "getrandomtrip-1");
  vi.stubEnv("NEXT_PUBLIC_RT_PUBLIC_ORIGIN", origin);
  const html = renderToStaticMarkup(
    createElement(TripCompleted, {
      client: "Jane",
      locale: "en",
      reviewToken: "review-token",
    }),
  );
  expect(html).toContain(`href="${origin}/en/review/review-token"`);
  expect(html).not.toContain('href="https://getrandomtrip.com/en/review/');
  const approved = renderToStaticMarkup(
    createElement(BlogApproved, {
      blogId: "blog",
      blogTitle: "Travel",
      locale: "es",
      tripper: "Jane",
    }),
  );
  expect(approved).toContain(`href="${origin}/es/dashboard/tripper/blog/blog"`);
});
