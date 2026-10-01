"use client";

import { useEffect, useRef, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import AuthModal from "@/components/auth/AuthModal";
import { emailsMatch, maskEmail } from "@/lib/travelers/travelerEmail";
import { inviteReturnPath } from "@/lib/auth/inviteReturnPath";
import { pathForLocale } from "@/lib/i18n/pathForLocale";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { InviteTravelersDict } from "@/lib/types/dictionary";

type Reason = "invalid" | "expired" | "used" | "ended";
export type TravelerInviteResolution =
  | {
      ok: true;
      buyerFirstName: string;
      idDocumentRequired?: boolean;
      /**
       * Full invited address, present ONLY when the server saw a session with
       * that address. Never sent to anonymous or mismatched viewers.
       */
      invitedEmail?: string | null;
      /** Masked form (`j***@gmail.com`): the sign-up hint and the mismatch message. */
      maskedEmail?: string | null;
      /** Server-detected: the signed-in account's email differs from the invite. */
      emailMismatch?: boolean;
    }
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
    return <ErrorCard copy={copy} reason={resolution.reason} data-component="TravelerInviteClient" />;
  }

  return (
    <InviteForm
      authCopy={authCopy}
      buyerFirstName={resolution.buyerFirstName}
      copy={copy}
      idDocumentRequired={resolution.idDocumentRequired ?? true}
      initialMismatch={resolution.emailMismatch ?? false}
      invitedEmail={resolution.invitedEmail ?? null}
      locale={locale}
      maskedEmail={resolution.maskedEmail ?? null}
      token={token} data-component="TravelerInviteClient"
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
    ended: copy.landingReasonEnded,
  };

  return (
    <CardShell>
      <XCircle aria-hidden className="mx-auto mb-4 h-10 w-10 text-red-600" />
      <h1 className="font-barlow-condensed text-2xl font-extrabold uppercase text-ink">
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
  idDocumentRequired,
  initialMismatch,
  invitedEmail,
  locale,
  maskedEmail,
  token,
}: {
  authCopy: Pick<Dictionary, "auth">;
  buyerFirstName: string;
  idDocumentRequired: boolean;
  copy: InviteTravelersDict;
  initialMismatch: boolean;
  invitedEmail: string | null;
  locale: Locale;
  maskedEmail: string | null;
  token: string | null;
}) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const authenticated = status === "authenticated";
  // The invite is bound to one address: a signed-in account with another email
  // cannot claim it (the server enforces the same rule on submit). The client
  // only holds the full address when the server saw a matching session, so a
  // mismatch is otherwise learned from the server (initial render or submit).
  const [serverMismatch, setServerMismatch] = useState(initialMismatch);
  const emailMismatch =
    serverMismatch ||
    (authenticated &&
      Boolean(invitedEmail) &&
      !emailsMatch(session?.user?.email, invitedEmail));
  // Claiming needs a verified email (enforced by `submit`). `emailVerified`
  // comes from the DB-backed session; a `403 email_unverified` on submit
  // switches to the same state.
  const [serverUnverified, setServerUnverified] = useState(false);
  const emailUnverified =
    serverUnverified ||
    (authenticated && session?.user?.emailVerified === false);
  const unverifiedAddress =
    maskedEmail ?? maskEmail(session?.user?.email) ?? "";
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
  const [previousAuthenticated, setPreviousAuthenticated] = useState(authenticated);
  if (previousAuthenticated !== authenticated) {
    setPreviousAuthenticated(authenticated);
    if (authenticated) setAuthOpen(false);
  }

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
    if ((idDocumentRequired && !idDocument.trim()) || !token) {
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
      if (res.status === 403 && data?.error === "email_mismatch") {
        setState("form");
        setServerMismatch(true);
        return;
      }
      if (res.status === 403 && data?.error === "email_unverified") {
        setState("form");
        setServerUnverified(true);
        return;
      }
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
        <h1 className="font-barlow-condensed text-2xl font-extrabold uppercase text-ink">
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
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          {copy.landingEyebrow}
        </p>
        <h1 className="mt-1.5 font-barlow-condensed text-3xl font-extrabold uppercase leading-none text-ink">
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

        {emailMismatch ? (
          <div className="mt-6 text-left">
            <div
              className="rounded-md border border-amber-200 bg-amber-50 p-4"
              role="alert"
            >
              <p className="text-sm text-amber-800">
                {copy.landingEmailMismatch.replace(
                  "{maskedEmail}",
                  maskedEmail ?? "",
                )}
              </p>
            </div>
            <Button
              className="mt-5 w-full"
              onClick={() => void signOut({ callbackUrl: window.location.href })}
              size="lg"
              type="button"
              variant="secondary"
            >
              {copy.landingSwitchAccount}
            </Button>
          </div>
        ) : emailUnverified ? (
          <div className="mt-6 text-left" role="status">
            <div className="rounded-md border border-sky-200 bg-sky-50 p-4">
              <p className="text-sm text-sky-900">
                {copy.landingVerifyInbox.replace(
                  "{maskedEmail}",
                  unverifiedAddress,
                )}
              </p>
            </div>
          </div>
        ) : !authenticated ? (
          <div className="mt-6 text-left">
            <p className="text-sm text-neutral-600">
              {copy.landingSignupExplainer}
            </p>
            {maskedEmail && (
              <p className="mt-3 text-sm font-medium text-ink">
                {copy.landingEmailHint.replace("{maskedEmail}", maskedEmail)}
              </p>
            )}
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
            <h2 className="font-barlow-condensed text-xl font-extrabold uppercase text-ink">
              {copy.landingStep2Heading}
            </h2>
            {idDocumentRequired && <FormField
              id="traveler-invite-idDocument"
              label={copy.idDocumentLabel}
              onChange={(e) => setIdDocument(e.target.value)}
              placeholder={copy.idDocumentPlaceholder}
              required
              type="text"
              value={idDocument}
            />}

            <label className="flex items-start gap-2 text-xs leading-relaxed text-neutral-600">
              <input
                checked={consent}
                className="mt-0.5"
                onChange={(e) => setConsent(e.target.checked)}
                type="checkbox"
              />
              <span>
                {copy.landingConsentPrefix}
                <Link className="text-secondary underline" href={privacyHref}>
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
        inviteReturnPath={token ? inviteReturnPath(locale, token) : undefined}
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
      />
    </>
  );
}
