"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, MailX, XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { pathForLocale } from "@/lib/i18n/pathForLocale";
import type { Locale } from "@/lib/i18n/config";
import type { EmailUnsubscribeDict } from "@/lib/types/dictionary";

type UnsubscribeState = "idle" | "pending" | "success" | "invalid" | "error";

interface UnsubscribeClientProps {
  copy: EmailUnsubscribeDict;
  locale: Locale;
  /** Signed token from the email link; `null` when the URL carried none. */
  token: string | null;
}

const HEADING_CLASS =
  "font-barlow-condensed text-3xl font-extrabold uppercase leading-none text-ink";

export function UnsubscribeClient({
  copy,
  locale,
  token,
}: UnsubscribeClientProps) {
  const [state, setState] = useState<UnsubscribeState>(
    token ? "idle" : "invalid",
  );
  const inFlight = useRef(false);

  async function handleConfirm() {
    if (!token || inFlight.current) return;
    inFlight.current = true;
    setState("pending");
    try {
      const res = await fetch("/api/email/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      setState(res.ok ? "success" : res.status === 400 ? "invalid" : "error");
    } catch {
      setState("error");
    } finally {
      inFlight.current = false;
    }
  }

  const homeLink = (
    <Button asChild className="mt-6" size="md" variant="secondary">
      <Link href={pathForLocale(locale, "/")}>{copy.homeCta}</Link>
    </Button>
  );

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-ground px-4 py-16"
      data-component="UnsubscribeClient"
    >
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm sm:p-10">
        {state === "success" && (
          <>
            <CheckCircle2
              aria-hidden
              className="mx-auto mb-4 h-10 w-10 text-green-600"
            />
            <h1 className={HEADING_CLASS}>{copy.successTitle}</h1>
            <p className="mt-3 text-sm text-neutral-700">{copy.successBody}</p>
            {homeLink}
          </>
        )}

        {state === "invalid" && (
          <>
            <XCircle
              aria-hidden
              className="mx-auto mb-4 h-10 w-10 text-red-600"
            />
            <h1 className={HEADING_CLASS}>{copy.invalidTitle}</h1>
            <p className="mt-3 text-sm text-neutral-700">{copy.invalidBody}</p>
            {homeLink}
          </>
        )}

        {(state === "idle" || state === "pending" || state === "error") && (
          <>
            <MailX
              aria-hidden
              className="mx-auto mb-4 h-10 w-10 text-primary"
            />
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              {copy.eyebrow}
            </p>
            <h1 className={`mt-1.5 ${HEADING_CLASS}`}>{copy.title}</h1>
            <p className="mt-3 text-sm text-neutral-700">{copy.body}</p>
            {state === "error" && (
              <p className="mt-4 text-sm text-red-700" role="alert">
                {copy.error}
              </p>
            )}
            <Button
              aria-busy={state === "pending"}
              className="mt-6 w-full uppercase tracking-[1.5px]"
              disabled={state === "pending"}
              onClick={handleConfirm}
              size="md"
              type="button"
            >
              {state === "pending" ? (
                <>
                  <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
                  {copy.pending}
                </>
              ) : (
                copy.confirmCta
              )}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
