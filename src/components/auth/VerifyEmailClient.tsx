"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { pathForLocale } from "@/lib/i18n/pathForLocale";
import type { Locale } from "@/lib/i18n/config";
import type { VerifyEmailPageDict } from "@/lib/types/dictionary";

type Reason = "invalid" | "expired" | "used" | "missing";
type State = "verifying" | "success" | "error";

interface VerifyEmailClientProps {
  token: string | null;
  locale: Locale;
  copy: VerifyEmailPageDict;
}

export default function VerifyEmailClient({
  token,
  locale,
  copy,
}: VerifyEmailClientProps) {
  const [state, setState] = useState<State>(token ? "verifying" : "error");
  const [reason, setReason] = useState<Reason>("missing");
  const router = useRouter();

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    void (async () => {
      try {
        const res = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();

        if (cancelled) return;

        if (res.ok && data.ok) {
          setState("success");
          const loginPath = pathForLocale(locale, "/login");
          const target = data.email
            ? `${loginPath}?email=${encodeURIComponent(data.email)}`
            : loginPath;
          router.replace(target);
        } else {
          setState("error");
          setReason((data.reason as Reason) ?? "invalid");
        }
      } catch {
        if (!cancelled) {
          setState("error");
          setReason("invalid");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, locale, router]);

  const reasonCopy: Record<Reason, string> = {
    invalid: copy.reasonInvalid,
    expired: copy.reasonExpired,
    used: copy.reasonUsed,
    missing: copy.reasonMissing,
  };

  const loginHref = pathForLocale(locale, "/login");

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
        {state === "verifying" && (
          <>
            <Loader2
              aria-hidden
              className="mx-auto mb-4 h-10 w-10 animate-spin text-light-blue"
            />
            <h1 className="font-barlow-condensed text-2xl font-extrabold uppercase text-gray-900">
              {copy.verifyingTitle}
            </h1>
            <p className="mt-2 text-sm text-neutral-600">
              {copy.verifyingBody}
            </p>
          </>
        )}

        {state === "success" && (
          <>
            <CheckCircle2
              aria-hidden
              className="mx-auto mb-4 h-10 w-10 text-green-600"
            />
            <h1 className="font-barlow-condensed text-2xl font-extrabold uppercase text-gray-900">
              {copy.successTitle}
            </h1>
            <p className="mt-2 text-sm text-neutral-600">
              {copy.successBody}
            </p>
            <Link className="mt-6 inline-block" href={loginHref}>
              <Button size="md">{copy.loginCta}</Button>
            </Link>
          </>
        )}

        {state === "error" && (
          <>
            <XCircle
              aria-hidden
              className="mx-auto mb-4 h-10 w-10 text-red-600"
            />
            <h1 className="font-barlow-condensed text-2xl font-extrabold uppercase text-gray-900">
              {copy.errorTitle}
            </h1>
            <p className="mt-2 text-sm text-neutral-600">
              {reasonCopy[reason]}
            </p>
            <Link className="mt-6 inline-block" href={loginHref}>
              <Button size="md" variant="secondary">
                {copy.loginCta}
              </Button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
