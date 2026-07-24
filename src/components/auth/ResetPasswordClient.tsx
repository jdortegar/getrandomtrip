"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { pathForLocale } from "@/lib/i18n/pathForLocale";
import type { Locale } from "@/lib/i18n/config";
import type { ResetPasswordPageDict } from "@/lib/types/dictionary";
import { isValidPassword } from "@/lib/validation/password";

type Reason = "invalid" | "expired" | "used" | "missing";
type State = "form" | "submitting" | "success" | "error";

interface ResetPasswordClientProps {
  token: string | null;
  locale: Locale;
  copy: ResetPasswordPageDict;
}

export default function ResetPasswordClient({
  token,
  locale,
  copy,
}: ResetPasswordClientProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [state, setState] = useState<State>(token ? "form" : "error");
  const [reason, setReason] = useState<Reason>("missing");
  const [fieldError, setFieldError] = useState("");

  const loginHref = pathForLocale(locale, "/login");

  const reasonCopy: Record<Reason, string> = {
    invalid: copy.reasonInvalid,
    expired: copy.reasonExpired,
    used: copy.reasonUsed,
    missing: copy.reasonMissing ?? copy.reasonInvalid,
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (!isValidPassword(password)) {
      setFieldError(copy.weakPassword);
      return;
    }
    if (password !== confirmPassword) {
      setFieldError(copy.mismatch);
      return;
    }

    setFieldError("");
    setState("submitting");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();

      if (res.ok && data.ok) {
        setState("success");
      } else {
        setState("error");
        setReason((data.reason as Reason) ?? "invalid");
      }
    } catch {
      setState("error");
      setReason("invalid");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-10 shadow-sm">
        {(state === "form" || state === "submitting") && (
          <>
            <h1 className="font-barlow-condensed text-2xl font-extrabold uppercase text-gray-900">
              {copy.title}
            </h1>
            <p className="mt-2 text-sm text-neutral-600">{copy.subtitle}</p>

            <form className="mt-6 space-y-5" onSubmit={handleSubmit} noValidate>
              <FormField
                id="reset-new-password"
                label={copy.newPasswordLabel}
                placeholder={copy.newPasswordPlaceholder}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
              <FormField
                id="reset-confirm-password"
                label={copy.confirmPasswordLabel}
                placeholder={copy.confirmPasswordPlaceholder}
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
              <p className="text-xs text-neutral-500">{copy.policyHint}</p>

              {fieldError && (
                <div
                  className="rounded-md border border-red-200 bg-red-50 p-3"
                  role="alert"
                >
                  <p className="text-sm text-red-700">{fieldError}</p>
                </div>
              )}

              <Button
                className="w-full"
                disabled={state === "submitting"}
                size="lg"
                type="submit"
              >
                {state === "submitting" ? copy.submitting : copy.submitLabel}
              </Button>
            </form>
          </>
        )}

        {state === "success" && (
          <div className="text-center">
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
          </div>
        )}

        {state === "error" && (
          <div className="text-center">
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
          </div>
        )}
      </div>
    </div>
  );
}
