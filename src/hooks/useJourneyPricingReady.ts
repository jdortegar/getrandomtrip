"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { journeyPricingKey } from "@/lib/pricing/journey-pricing-context";

export { journeyPricingKey } from "@/lib/pricing/journey-pricing-context";

/** Don't flash a previous session's booking price while App Router refreshes. */
export function useJourneyPricingReady(binding: string) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useSearchParams();
  const current = journeyPricingKey(
    session?.user?.email,
    params.get("tripRequestId"),
    params.get("travelType") ?? "couple",
  );
  const ready = status !== "loading" && current === binding;
  useEffect(() => {
    if (status !== "loading" && current !== binding) router.refresh();
  }, [binding, current, router, status]);
  return ready;
}
