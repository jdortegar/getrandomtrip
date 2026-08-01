"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import AuthModal from "@/components/auth/AuthModal";
import { pathForLocale } from "@/lib/i18n/pathForLocale";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { InviteTravelersDict } from "@/lib/types/dictionary";

type Reason = "invalid" | "expired" | "used" | "locked";

export type TravelerInviteResolution =
  | { ok: true; buyerFirstName: string }
  | { ok: false; reason: Reason };

type FormState = "form" | "submitting" | "success";

interface TravelerInviteClientProps {
  authCopy: Pick<Dictionary, "auth">;
  copy: InviteTravelersDict;
  locale: Locale;
  resolution: TravelerInviteResolution;
  token: string | null;
}

export default function TravelerInviteClient({
  authCopy,
  copy,
  locale,
  resolution,
  token,
}: TravelerInviteClientProps) {
  if (!resolution.ok) {
    return <ErrorCard copy={copy} reason={resolution.reason} />;
  }

  return (
    <InviteForm
      authCopy={authCopy}
      buyerFirstName={resolution.buyerFirstName}
      copy={copy}
      locale={locale}
      token={token}
    />
  );
}

function CardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white px-8 py-14 text-center shadow-sm sm:px-12">
        {children}
      </div>
    </div>
  );
}

function ErrorCard({
  copy,
  reason,
}: {
  copy: InviteTravelersDict;
  reason: Reason;
}) {
  const reasonCopy: Record<Reason, string> = {
    invalid: copy.landingReasonInvalid,
    expired: copy.landingReasonExpired,
    used: copy.landingReasonUsed,
    locked: copy.landingReasonLocked,
  };

  return (
    <CardShell>
      <XCircle aria-hidden className="mx-auto mb-4 h-10 w-10 text-red-600" />
      <h1 className="font-barlow-condensed text-2xl font-extrabold uppercase text-gray-900">
        {copy.landingErrorTitle}
      </h1>
      <p className="mt-2 text-sm text-neutral-600">{reasonCopy[reason]}</p>
    </CardShell>
  );
}

function InviteForm({
  authCopy,
  buyerFirstName,
  copy,
  locale,
  token,
}: {
  authCopy: Pick<Dictionary, "auth">;
  buyerFirstName: string;
  copy: InviteTravelersDict;
  locale: Locale;
  token: string | null;
}) {
  const router = useRouter();
  const { status } = useSession();
  const authenticated = status === "authenticated";

  const [authOpen, setAuthOpen] = useState(false);
  const [state, setState] = useState<FormState>("form");
  const [idDocument, setIdDocument] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const privacyHref = pathForLocale(locale, "/privacy");

  // Closes the modal on both the credentials-login path and the Google
  // full-page-return remount. Deliberately keyed off `status`, never off
  // `AuthModal`'s `onClose` — `onClose` also fires on Escape/backdrop/X, so
  // it does not imply success.
  useEffect(() => {
    if (authenticated) setAuthOpen(false);
  }, [authenticated]);

  useEffect(() => {
    return () => {
      if (redirectTimer.current) clearTimeout(redirectTimer.current);
    };
  }, []);

  async function handleCtaClick() {
    // Fail-open: mints the invite-grant cookie so an unverified account can
    // still get a session (see `authorize()` bypass). If this call fails or
    // rejects, the modal still opens — the exception simply won't apply.
    try {
      if (token) {
        await fetch("/api/travelers/invite-auth-init", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
      }
    } catch {
      // Fail-open — see comment above.
    } finally {
      setAuthOpen(true);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!consent) {
      setError(copy.landingConsentRequiredError);
      return;
    }
    if (!idDocument.trim() || !token) {
      setError(copy.landingGenericError);
      return;
    }

    setState("submitting");
    try {
      const res = await fetch("/api/travelers/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, idDocument, consent }),
      });

      if (res.status === 401) {
        setState("form");
        setError(copy.landingSessionExpiredError);
        return;
      }

      const data = await res.json();

      if (!res.ok || !data.ok) {
        setState("form");
        setError(copy.landingGenericError);
        return;
      }

      setState("success");
      redirectTimer.current = setTimeout(() => {
        router.push(`/${locale}/dashboard`);
      }, 1500);
    } catch {
      setState("form");
      setError(copy.landingGenericError);
    }
  };

  if (state === "success") {
    return (
      <CardShell>
        <CheckCircle2
          aria-hidden
          className="mx-auto mb-4 h-10 w-10 text-green-600"
        />
        <h1 className="font-barlow-condensed text-2xl font-extrabold uppercase text-gray-900">
          {copy.landingSuccessTitle}
        </h1>
        <p className="mt-2 text-sm text-neutral-600">
          {copy.landingSuccessBody}
        </p>
        <p className="mt-4 text-xs text-neutral-400">
          {copy.landingRedirecting}
        </p>
      </CardShell>
    );
  }

  return (
    <>
      <CardShell>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-light-blue">
          {copy.landingEyebrow}
        </p>
        <h1 className="mt-1.5 font-barlow-condensed text-3xl font-extrabold uppercase leading-none text-gray-900">
          {copy.landingHeading}
        </h1>
        <p className="mt-4 text-left text-sm text-neutral-600">
          {copy.landingGreeting.replace("{buyerFirstName}", buyerFirstName)}
        </p>

        {error && (
          <div
            className="mt-4 rounded-md border border-red-200 bg-red-50 p-4 text-left"
            role="alert"
          >
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {!authenticated ? (
          <div className="mt-6 text-left">
            <p className="text-sm text-neutral-600">
              {copy.landingSignupExplainer}
            </p>
            <Button
              className="mt-5 w-full"
              onClick={handleCtaClick}
              size="lg"
              type="button"
            >
              {copy.landingSignupCta}
            </Button>
          </div>
        ) : (
          <form className="mt-6 space-y-5 text-left" onSubmit={handleSubmit}>
            <h2 className="font-barlow-condensed text-xl font-extrabold uppercase text-gray-900">
              {copy.landingStep2Heading}
            </h2>
            <FormField
              id="traveler-invite-idDocument"
              label={copy.idDocumentLabel}
              onChange={(e) => setIdDocument(e.target.value)}
              placeholder={copy.idDocumentPlaceholder}
              required
              type="text"
              value={idDocument}
            />

            <label className="flex items-start gap-2 text-xs leading-relaxed text-neutral-600">
              <input
                checked={consent}
                className="mt-0.5"
                onChange={(e) => setConsent(e.target.checked)}
                type="checkbox"
              />
              <span>
                {copy.landingConsentPrefix}
                <Link className="text-light-blue underline" href={privacyHref}>
                  {copy.landingConsentLinkLabel}
                </Link>
                {copy.landingConsentSuffix}
              </span>
            </label>

            <Button
              className="w-full"
              disabled={state === "submitting"}
              size="lg"
              type="submit"
            >
              {state === "submitting"
                ? copy.landingSubmitting
                : copy.landingSubmitLabel}
            </Button>
          </form>
        )}
      </CardShell>

      <AuthModal
        allowRegister
        defaultMode="register"
        dict={authCopy}
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
      />
    </>
  );
}
