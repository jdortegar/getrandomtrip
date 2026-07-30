"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { pathForLocale } from "@/lib/i18n/pathForLocale";
import type { Locale } from "@/lib/i18n/config";
import type { InviteTravelersDict } from "@/lib/types/dictionary";

type Reason = "invalid" | "expired" | "used" | "locked";

export type TravelerInviteResolution =
  | { ok: true; buyerFirstName: string }
  | { ok: false; reason: Reason };

type FormState = "form" | "submitting" | "success";

interface TravelerInviteClientProps {
  copy: InviteTravelersDict;
  locale: Locale;
  resolution: TravelerInviteResolution;
  token: string | null;
}

export default function TravelerInviteClient({
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
  buyerFirstName,
  copy,
  locale,
  token,
}: {
  buyerFirstName: string;
  copy: InviteTravelersDict;
  locale: Locale;
  token: string | null;
}) {
  const [state, setState] = useState<FormState>("form");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [idDocument, setIdDocument] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");

  const loginHref = pathForLocale(locale, "/login");
  const privacyHref = pathForLocale(locale, "/privacy");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!consent) {
      setError(copy.landingConsentRequiredError);
      return;
    }
    if (!fullName.trim() || !idDocument.trim() || !token) {
      setError(copy.landingGenericError);
      return;
    }

    setState("submitting");
    try {
      const res = await fetch("/api/travelers/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          fullName,
          idDocument,
          ...(email.trim() && { email: email.trim() }),
          consent,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        setState("form");
        setError(copy.landingGenericError);
        return;
      }

      setState("success");
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
      </CardShell>
    );
  }

  return (
    <CardShell>
      <p className="font-barlow-condensed text-lg font-extrabold uppercase tracking-wide text-gray-900">
        {copy.landingBrand}
      </p>
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

      <form className="mt-6 space-y-5 text-left" onSubmit={handleSubmit}>
        <FormField
          id="traveler-invite-fullName"
          label={copy.fullNameLabel}
          onChange={(e) => setFullName(e.target.value)}
          placeholder={copy.fullNamePlaceholder}
          required
          type="text"
          value={fullName}
        />
        <FormField
          id="traveler-invite-email"
          label={copy.emailLabel}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={copy.emailPlaceholder}
          type="email"
          value={email}
        />
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

      <p className="mt-5 text-center text-xs text-neutral-500">
        {copy.landingCreateAccountPrompt}{" "}
        <Link className="text-light-blue underline" href={loginHref}>
          {copy.landingCreateAccountLink}
        </Link>
      </p>
    </CardShell>
  );
}
