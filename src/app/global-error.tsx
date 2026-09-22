"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { errorFallback as en } from "@/dictionaries/en.json";
import { errorFallback as es } from "@/dictionaries/es.json";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/config";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);
  const copy = locale === "en" ? en : es;

  useEffect(() => {
    setLocale(window.location.pathname.split("/")[1] === "en" ? "en" : "es");
    Sentry.captureException(error);
  }, [error]);

  // This replaces the root layout: no router, providers, or global CSS required.
  return (
    <html lang={locale}>
      <body style={{ color: "#383838", fontFamily: "sans-serif", margin: 0 }}>
        <main style={{ margin: "10vh auto", maxWidth: 480, padding: 24 }}>
          <h1>{copy.title}</h1>
          <p>{copy.description}</p>
          <Button onClick={reset} type="button">
            {copy.retry}
          </Button>
        </main>
      </body>
    </html>
  );
}
