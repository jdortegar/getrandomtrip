"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { CheckCircle2, Loader2, MailCheck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { pathForLocale } from "@/lib/i18n/pathForLocale";
import type { Locale } from "@/lib/i18n/config";
import { isValidPassword } from "@/lib/validation/password";
import { registerErrorMessage } from "@/lib/auth/registerErrorMessages";
import type { MarketingDictionary, TripperInviteAcceptDict } from "@/lib/types/dictionary";

type Reason = "invalid" | "expired" | "used" | "missing";

export type TripperInviteResolution =
  | { ok: true; email: string; hasAccount: boolean }
  | { ok: false; reason: Reason };

type ExistingUserState = "granting" | "granted" | "error";
type NewUserState = "form" | "submitting" | "success" | "error";

interface TripperInviteClientProps {
  authCopy: MarketingDictionary["auth"];
  copy: TripperInviteAcceptDict;
  locale: Locale;
  resolution: TripperInviteResolution;
  token: string | null;
}

export default function TripperInviteClient({
  authCopy,
  copy,
  locale,
  resolution,
  token,
}: TripperInviteClientProps) {
  const loginHref = pathForLocale(locale, "/login");
  const reasonCopy: Record<Reason, string> = {
    invalid: copy.reasonInvalid,
    expired: copy.reasonExpired,
    used: copy.reasonUsed,
    missing: copy.reasonMissing,
  };

  if (!resolution.ok) {
    return (
      <ErrorCard copy={copy} loginHref={loginHref} reason={resolution.reason} reasonCopy={reasonCopy} />
    );
  }

  return resolution.hasAccount ? (
    <ExistingUserBranch copy={copy} loginHref={loginHref} token={token} />
  ) : (
    <NewUserBranch
      authCopy={authCopy}
      copy={copy}
      email={resolution.email}
      locale={locale}
      loginHref={loginHref}
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
  loginHref,
  reason,
  reasonCopy,
}: {
  copy: TripperInviteAcceptDict;
  loginHref: string;
  reason: Reason;
  reasonCopy: Record<Reason, string>;
}) {
  return (
    <CardShell>
      <XCircle aria-hidden className="mx-auto mb-4 h-10 w-10 text-red-600" />
      <h1 className="font-barlow-condensed text-2xl font-extrabold uppercase text-gray-900">
        {copy.errorTitle}
      </h1>
      <p className="mt-2 text-sm text-neutral-600">{reasonCopy[reason]}</p>
      <Link className="mt-6 inline-block" href={loginHref}>
        <Button size="md" variant="secondary">
          {copy.loginCta}
        </Button>
      </Link>
    </CardShell>
  );
}

function ExistingUserBranch({
  copy,
  loginHref,
  token,
}: {
  copy: TripperInviteAcceptDict;
  loginHref: string;
  token: string | null;
}) {
  const [state, setState] = useState<ExistingUserState>("granting");
  const [reason, setReason] = useState<Reason>("invalid");

  useEffect(() => {
    if (!token) {
      setState("error");
      setReason("missing");
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const res = await fetch("/api/tripper-invite/accept", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json();

        if (cancelled) return;

        if (res.ok && data.ok) {
          setState("granted");
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
  }, [token]);

  if (state === "granting") {
    return (
      <CardShell>
        <Loader2
          aria-hidden
          className="mx-auto mb-4 h-10 w-10 animate-spin text-light-blue"
        />
        <h1 className="font-barlow-condensed text-2xl font-extrabold uppercase text-gray-900">
          {copy.loadingTitle}
        </h1>
        <p className="mt-2 text-sm text-neutral-600">{copy.loadingBody}</p>
      </CardShell>
    );
  }

  if (state === "granted") {
    return (
      <CardShell>
        <CheckCircle2
          aria-hidden
          className="mx-auto mb-4 h-10 w-10 text-green-600"
        />
        <h1 className="font-barlow-condensed text-2xl font-extrabold uppercase text-gray-900">
          {copy.grantedTitle}
        </h1>
        <p className="mt-2 text-sm text-neutral-600">{copy.grantedBody}</p>
        <Link className="mt-6 inline-block" href={loginHref}>
          <Button size="md">{copy.loginCta}</Button>
        </Link>
      </CardShell>
    );
  }

  const reasonCopy: Record<Reason, string> = {
    invalid: copy.reasonInvalid,
    expired: copy.reasonExpired,
    used: copy.reasonUsed,
    missing: copy.reasonMissing,
  };

  return (
    <ErrorCard copy={copy} loginHref={loginHref} reason={reason} reasonCopy={reasonCopy} />
  );
}

function NewUserBranch({
  authCopy,
  copy,
  email,
  locale,
  loginHref,
  token,
}: {
  authCopy: MarketingDictionary["auth"];
  copy: TripperInviteAcceptDict;
  email: string;
  locale: Locale;
  loginHref: string;
  token: string | null;
}) {
  const [state, setState] = useState<NewUserState>("form");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name) {
      setError(authCopy.nameRequired);
      return;
    }
    if (!isValidPassword(password)) {
      setError(authCopy.passwordPolicyHint);
      return;
    }

    setState("submitting");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, inviteToken: token }),
      });
      const data = await res.json();

      if (!res.ok) {
        setState("form");
        setError(
          registerErrorMessage(data.error, authCopy) ??
            copy.registerErrorGeneric,
        );
        return;
      }

      setState("success");
    } catch {
      setState("form");
      setError(copy.registerErrorGeneric);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!token) return;
    try {
      await fetch("/api/tripper-invite/oauth-init", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
    } finally {
      await signIn("google", { callbackUrl: pathForLocale(locale, "/") });
    }
  };

  if (state === "success") {
    return (
      <CardShell>
        <MailCheck
          aria-hidden
          className="mx-auto mb-4 h-10 w-10 text-green-600"
        />
        <h1 className="font-barlow-condensed text-2xl font-extrabold uppercase text-gray-900">
          {copy.registerSuccessTitle}
        </h1>
        <p className="mt-2 text-sm text-neutral-600">
          {copy.registerSuccessBody}
        </p>
        <Link className="mt-6 inline-block" href={loginHref}>
          <Button size="md">{copy.loginCta}</Button>
        </Link>
      </CardShell>
    );
  }

  return (
    <CardShell>
      <h1 className="font-barlow-condensed text-2xl font-extrabold uppercase text-gray-900">
        {copy.registerTitle}
      </h1>
      <p className="mt-2 text-sm text-neutral-600">{copy.registerSubtitle}</p>

      <Button
        className="mt-6 h-14 w-full bg-[#f2f3f8] text-base text-neutral-800 hover:bg-[#e9ebf3] border-neutral-200"
        disabled={state === "submitting"}
        onClick={() => void handleGoogleSignIn()}
        size="lg"
        type="button"
        variant="secondary"
      >
        <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        {authCopy.continueWithGoogle}
      </Button>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-neutral-200" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-5 text-neutral-400">
            {authCopy.orContinueWith}
          </span>
        </div>
      </div>

      {error && (
        <div
          className="mb-4 rounded-md border border-red-200 bg-red-50 p-4 text-left"
          role="alert"
        >
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <form className="space-y-6 text-left" onSubmit={handleSubmit}>
        <FormField
          autoComplete="name"
          id="tripper-invite-name"
          label={authCopy.nameLabel}
          onChange={(e) => setName(e.target.value)}
          placeholder={authCopy.namePlaceholder}
          required
          type="text"
          value={name}
        />
        <div>
          <FormField
            disabled
            id="tripper-invite-email"
            label={authCopy.email}
            readOnly
            type="email"
            value={email}
          />
          <p className="mt-1.5 text-xs text-neutral-500">
            {copy.emailLockedNote}
          </p>
        </div>
        <FormField
          autoComplete="new-password"
          id="tripper-invite-password"
          label={authCopy.password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={authCopy.passwordPolicyHint}
          required
          type="password"
          value={password}
        />
        <Button className="w-full" disabled={state === "submitting"} size="lg" type="submit">
          {state === "submitting" ? copy.submitting : copy.submitLabel}
        </Button>
      </form>
    </CardShell>
  );
}
