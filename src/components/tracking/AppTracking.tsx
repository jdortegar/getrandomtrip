"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useSyncExternalStore,
} from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  trackAiReferral,
  trackPageview,
  trackScrollDepth,
} from "@/lib/helpers/tracking/gtm";
import {
  classifyAiReferral,
  type AiSource,
} from "@/lib/helpers/tracking/aiReferral";
import {
  CONSENT_EVENT,
  readAnalyticsConsent,
  subscribeAnalyticsConsent,
} from "@/lib/helpers/tracking/consent";
import {
  configureAnalytics,
  loadAnalyticsContainer,
} from "@/lib/helpers/tracking/runtime";
import { trackOAuthSuccess } from "@/lib/helpers/tracking/authSuccess";

export default function AppTracking({
  waitlistVisible = false,
}: {
  waitlistVisible?: boolean;
}) {
  const pathname = usePathname();
  const consent = useSyncExternalStore(
    subscribeAnalyticsConsent,
    readAnalyticsConsent,
    () => null,
  );
  const { data: session } = useSession();
  const lastPage = useRef<string | null>(null);
  /** Landing AI source: captured once per document, cleared after a successful send. */
  const landingAiSource = useRef<AiSource | null | undefined>(undefined);

  useLayoutEffect(() => {
    const update = () => configureAnalytics(pathname, waitlistVisible);
    window.addEventListener(CONSENT_EVENT, update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener(CONSENT_EVENT, update);
      window.removeEventListener("storage", update);
      configureAnalytics("/__unavailable");
    };
  }, [pathname, waitlistVisible]);

  useLayoutEffect(() => {
    if (landingAiSource.current === undefined)
      landingAiSource.current = classifyAiReferral(
        document.referrer,
        window.location.search,
      );
    const page = configureAnalytics(pathname, waitlistVisible);
    if (!page) {
      lastPage.current = null;
      return;
    }
    loadAnalyticsContainer();
    const pageKey = `${pathname}:${waitlistVisible}`;
    if (lastPage.current !== pageKey && !page.purchaseOnly && !page.commerceOnly && trackPageview()) {
      lastPage.current = pageKey;
      const aiSource = landingAiSource.current;
      if (aiSource && trackAiReferral(aiSource)) landingAiSource.current = null;
    }
    const reached = new Set<number>();
    if (page.purchaseOnly || page.commerceOnly) return;
    const handleScroll = () => {
      const { scrollHeight } = document.documentElement;
      const percent = Math.round(
        ((window.scrollY + window.innerHeight) / scrollHeight) * 100,
      );
      for (const milestone of [25, 50, 75, 90, 100]) {
        if (
          percent >= milestone &&
          !reached.has(milestone) &&
          trackScrollDepth(milestone)
        )
          reached.add(milestone);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [pathname, consent, waitlistVisible]);

  useEffect(() => {
    trackOAuthSuccess(session?.analyticsAuthSuccess);
  }, [session?.analyticsAuthSuccess, consent, pathname]);
  return null;
}
