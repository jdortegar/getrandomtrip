"use client";

import * as Sentry from "@sentry/nextjs";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { MarketingDictionary } from "@/lib/types/dictionary";

interface SentryExamplePageClientProps {
  copy: MarketingDictionary["sentryExample"];
}

export function SentryExamplePageClient({
  copy,
}: SentryExamplePageClientProps) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<keyof typeof copy.status>("idle");

  const handleBrowserTest = async () => {
    if (!Sentry.isEnabled()) {
      setStatus("browserDisabled");
      return;
    }
    setBusy(true);
    setStatus("running");
    try {
      Sentry.captureException(new Error("Sentry browser smoke test"));
      const flushed = await Sentry.flush(2000);
      setStatus(flushed ? "browserAttempted" : "browserFailed");
    } catch {
      setStatus("browserFailed");
    } finally {
      setBusy(false);
    }
  };

  const handleServerTest = async () => {
    setBusy(true);
    setStatus("running");
    try {
      const response = await fetch("/api/sentry-example-api", {
        cache: "no-store",
        method: "POST",
      });
      setStatus(
        response.status === 500
          ? "serverAttempted"
          : response.status === 503
            ? "serverDisabled"
            : "serverFailed",
      );
    } catch {
      setStatus("serverFailed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="max-w-2xl mx-auto px-4 py-16 space-y-6 text-ink">
      <h1 className="font-bold text-3xl">{copy.title}</h1>
      <p>{copy.description}</p>
      <div className="flex flex-wrap gap-3">
        <Button disabled={busy} onClick={handleBrowserTest} type="button">
          {copy.browserButton}
        </Button>
        <Button disabled={busy} onClick={handleServerTest} type="button">
          {copy.serverButton}
        </Button>
      </div>
      <p aria-live="polite" role="status">
        {copy.status[status]}
      </p>
      <Button asChild variant="link">
        <a
          href="https://mycompany-t7.sentry.io/issues/?project=4512130719023104"
          rel="noreferrer"
          target="_blank"
        >
          {copy.issuesLink}
        </a>
      </Button>
    </section>
  );
}
