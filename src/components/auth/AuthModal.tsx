"use client";

import { useState, useEffect, useCallback } from "react";
import { signIn } from "next-auth/react";
import { trackCustomEvent } from "@/lib/helpers/tracking/gtm";
import { Button } from "@/components/ui/Button";
import { FormField, FormSelectField } from "@/components/ui/FormField";
import { X } from "lucide-react";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { isValidPassword } from "@/lib/validation/password";
import { isValidEmail } from "@/lib/validation/email";
import { registerErrorMessage } from "@/lib/auth/registerErrorMessages";

interface ActiveTripperOption {
  slug: string;
  name: string;
}

interface AuthModalProps {
  /** When false, hides the sign-up toggle and keeps the modal in login mode only. */
  allowRegister?: boolean;
  defaultMode?: "login" | "register";
  /** Only `dict.auth` is ever read — accepting the full Dictionary would force
   * every caller (including client components with statically-imported JSON)
   * to satisfy unrelated sections' stricter literal-union types. */
  dict?: Pick<Dictionary, "auth">;
  /** Pre-fills the email field, e.g. after landing here from a verify-email redirect. */
  initialEmail?: string;
  onClose: () => void;
  isOpen: boolean;
}

export default function AuthModal({
  allowRegister = true,
  defaultMode = "login",
  dict,
  initialEmail,
  isOpen,
  onClose,
}: AuthModalProps) {
  const t = dict?.auth;
  const [mode, setMode] = useState<"login" | "register">(
    allowRegister ? defaultMode : "login",
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [errorKind, setErrorKind] = useState<"generic" | "notVerified" | null>(
    null,
  );
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent">(
    "idle",
  );
  const [forgotState, setForgotState] = useState<"idle" | "sending" | "sent">(
    "idle",
  );

  const [name, setName] = useState("");
  const [email, setEmail] = useState(initialEmail ?? "");
  const [password, setPassword] = useState("");
  const [keepMeLoggedIn, setKeepMeLoggedIn] = useState(false);

  // Register-mode referring-tripper picker (design ADR-8/"AuthModal.tsx").
  // Three distinct states, not two:
  //  - "" (NOT_DECIDED_VALUE): still loading, or the user hasn't touched the
  //    dropdown yet -> submit omits the key entirely (`undefined`) so the
  //    server falls back to the anonymous `grt_tripper` cookie.
  //  - "none" (NONE_OPTION_VALUE): the user explicitly picked "None" ->
  //    submit sends literal `null`, never consults the cookie.
  //  - any other value: a real tripper slug, either pre-filled from the
  //    cookie once `/api/trippers/active` resolves, or picked manually ->
  //    submit sends that slug string.
  // Collapsing "not yet decided" and "explicitly none" into one empty-string
  // sentinel previously meant an in-flight/failed pre-fill fetch always sent
  // `null`, silently and permanently losing a real cookie-based referral
  // (write-once field) if the user submitted before it resolved.
  const NOT_DECIDED_VALUE = "";
  const NONE_OPTION_VALUE = "none";
  const [referredByTripperSlug, setReferredByTripperSlug] =
    useState(NOT_DECIDED_VALUE);
  const [activeTrippers, setActiveTrippers] = useState<ActiveTripperOption[]>(
    [],
  );
  const [hasFetchedActiveTrippers, setHasFetchedActiveTrippers] =
    useState(false);

  // Handle successful authentication - just close modal and let the page handle the next action
  const handleAuthSuccess = useCallback(() => {
    // Clear form state
    setName("");
    setEmail("");
    setPassword("");
    setError("");
    setErrorKind(null);
    setResendState("idle");
    setReferredByTripperSlug(NOT_DECIDED_VALUE);
    setHasFetchedActiveTrippers(false);
    setActiveTrippers([]);

    // Close modal
    onClose();

    // Let the page handle what happens next after authentication
    // No redirects - the page will detect the auth state change and proceed
  }, [onClose]);

  // Handle close - just close the modal, don't redirect
  const handleClose = useCallback(() => {
    // Reset the referring-tripper picker's fetch flag so a failed/aborted
    // pre-fill attempt gets a fresh retry the next time the modal opens,
    // instead of being permanently blocked for the rest of the page's
    // lifetime (previously this flag was only ever set once, on the
    // request firing, never on success/failure).
    setHasFetchedActiveTrippers(false);
    onClose();
    // Don't redirect when closing - let user stay on current page
  }, [onClose]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, handleClose]);

  useEffect(() => {
    if (!isOpen || initialEmail) return;
    const rememberedEmail = localStorage.getItem("auth-remember-email");
    if (!rememberedEmail) return;
    setEmail(rememberedEmail);
    setKeepMeLoggedIn(true);
  }, [isOpen, initialEmail]);

  // Fetch the active-trippers list once, the first time register mode is
  // reached — `current` (derived server-side from the httpOnly grt_tripper
  // cookie) pre-fills the picker only if the user hasn't already chosen a
  // value (spec "Pre-filled from anonymous cookie"). Best-effort: a fetch
  // failure just leaves the picker on its "None" default.
  useEffect(() => {
    if (mode !== "register" || hasFetchedActiveTrippers) return;

    fetch("/api/trippers/active")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { trippers?: ActiveTripperOption[]; current?: string | null } | null) => {
        if (!data) return;
        // Only mark as fetched on success — a failed/aborted request must
        // not permanently block retries (see handleClose's reset comment).
        setHasFetchedActiveTrippers(true);
        setActiveTrippers(data.trippers ?? []);
        if (data.current) {
          setReferredByTripperSlug((prev) => prev || data.current!);
        }
      })
      .catch(() => {
        // No-op — register still works with the "not yet decided" default,
        // which falls back to the cookie server-side on submit.
      });
  }, [mode, hasFetchedActiveTrippers]);

  const validateForm = () => {
    if (!email || !password) {
      setError(t?.fillAllFields ?? "");
      return false;
    }
    if (mode === "register" && !name) {
      setError(t?.nameRequired ?? "");
      return false;
    }
    if (mode === "register") {
      // Registration enforces the shared password policy (8+ chars, a
      // letter, a number); login keeps the looser legacy check so existing
      // accounts created before this policy still authenticate.
      if (!isValidPassword(password)) {
        setError(t?.passwordPolicyHint ?? "");
        return false;
      }
    } else if (password.length < 6) {
      setError(t?.passwordMinLength ?? "");
      return false;
    }
    if (!isValidEmail(email)) {
      setError(t?.invalidEmail ?? "");
      return false;
    }
    if (mode === "register" && referredByTripperSlug === NOT_DECIDED_VALUE) {
      setError(t?.referredByRequired ?? "");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError("");
    setErrorKind(null);

    try {
      if (mode === "register") {
        // Register new user.
        // `referredByTripperSlugForSubmit` resolves the picker's three
        // states: NOT_DECIDED_VALUE -> `undefined` (JSON.stringify drops the
        // key -> server falls back to the cookie); NONE_OPTION_VALUE ->
        // explicit `null` (server never consults the cookie); anything else
        // -> that slug string.
        const referredByTripperSlugForSubmit: string | null | undefined =
          referredByTripperSlug === NOT_DECIDED_VALUE
            ? undefined
            : referredByTripperSlug === NONE_OPTION_VALUE
              ? null
              : referredByTripperSlug;

        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            email,
            password,
            referredByTripperSlug: referredByTripperSlugForSubmit,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            registerErrorMessage(data.error, t) ?? (t?.loginFailed ?? ""),
          );
        }

        // Auto-login after successful registration — now gated by the
        // verification requirement, so this is expected to return
        // EMAIL_NOT_VERIFIED rather than silently logging in.
        const result = await signIn("credentials", {
          email,
          rememberMe: keepMeLoggedIn ? "true" : "false",
          password,
          redirect: false,
        });

        if (result?.error === "EMAIL_NOT_VERIFIED") {
          setErrorKind("notVerified");
          setIsLoading(false);
          return;
        }

        if (result?.error) {
          throw new Error(
            result.error === "Invalid credentials"
              ? (t?.invalidCredentials ?? "")
              : (t?.loginFailed ?? ""),
          );
        }

        // Handle successful authentication
        trackCustomEvent({ event: "sign_up", method: "email" });
        handleAuthSuccess();
      } else {
        // Login existing user
        const result = await signIn("credentials", {
          email,
          rememberMe: keepMeLoggedIn ? "true" : "false",
          password,
          redirect: false,
        });

        if (result?.error === "EMAIL_NOT_VERIFIED") {
          setErrorKind("notVerified");
          setIsLoading(false);
          return;
        }

        if (result?.error) {
          setErrorKind("generic");
          throw new Error(
            result.error === "Invalid credentials"
              ? (t?.invalidCredentials ?? "")
              : (t?.loginFailed ?? ""),
          );
        }

        // Handle successful authentication
        if (keepMeLoggedIn) {
          localStorage.setItem("auth-remember-email", email);
        } else {
          localStorage.removeItem("auth-remember-email");
        }
        trackCustomEvent({ event: "login", method: "email" });
        handleAuthSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : (t?.loginFailed ?? ""));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = useCallback(async () => {
    setResendState("sending");
    try {
      // Re-invokes signIn with the credentials already in form state, which
      // re-triggers the server-side auto-send inside authorize().
      await signIn("credentials", {
        email,
        password,
        rememberMe: "false",
        redirect: false,
      });
    } finally {
      setResendState("sent");
    }
  }, [email, password]);

  const handleGoogleSignIn = useCallback(async () => {
    // Register mode requires the referring-tripper choice up front, same as
    // the credentials path (validateForm) — Google's OAuth redirect can't
    // carry this component's state through the round-trip, so an explicit
    // pick (real slug or "None") is synced into the `grt_tripper` cookie via
    // the same reviewed/CSRF-guarded endpoint the mode-toggle banner uses
    // (`/api/attribution/mode`) right before handing off to Google. The
    // signIn callback (`auth.ts`) then reads that cookie for the new account.
    if (mode === "register") {
      if (referredByTripperSlug === NOT_DECIDED_VALUE) {
        setError(t?.referredByRequired ?? "");
        return;
      }
      setIsLoading(true);
      setError("");
      try {
        const syncResponse = await fetch("/api/attribution/mode", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            referredByTripperSlug === NONE_OPTION_VALUE
              ? { mode: "randomtrip" }
              : { mode: "tripper", slug: referredByTripperSlug },
          ),
        });
        if (!syncResponse.ok) {
          setError(t?.loginFailed ?? "");
          setIsLoading(false);
          return;
        }
      } catch {
        setError(t?.loginFailed ?? "");
        setIsLoading(false);
        return;
      }
      setIsLoading(false);
    }
    trackCustomEvent({ event: mode === "register" ? "sign_up" : "login", method: "google" });
    // Use current page as callback - let the page handle what happens next
    await signIn("google", { callbackUrl: window.location.href });
  }, [mode, referredByTripperSlug, t?.referredByRequired, t?.loginFailed]);

  const toggleMode = useCallback(() => {
    setMode(mode === "login" ? "register" : "login");
    setError("");
    setErrorKind(null);
    setForgotState("idle");
  }, [mode]);

  const handleForgotPassword = useCallback(async () => {
    if (!email || !isValidEmail(email)) {
      setError(t?.invalidEmail ?? "");
      return;
    }
    setForgotState("sending");
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } finally {
      // Always show the generic "if that email exists, we sent a link"
      // message — enumeration-safe on the client too.
      setForgotState("sent");
    }
  }, [email, t?.invalidEmail]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div className="relative w-full max-w-lg bg-white rounded-lg shadow-2xl border border-gray-200">
        {/* Close button */}
        <button
          aria-label={t?.close}
          className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600 transition-colors z-20 p-1 rounded-md hover:bg-neutral-100 cursor-pointer"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleClose();
          }}
          type="button"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mx-auto max-w-xl px-8 py-14 sm:px-12">
          {/* Header */}
          <div className="mb-8">
            <h2 className="font-barlow-condensed text-3xl font-bold uppercase text-neutral-800">
              {mode === "login" ? t?.signIn : t?.createAccount}
            </h2>
            <p className="mt-2 text-lg font-light text-neutral-500">
              {mode === "login" ? t?.loginSubtitle : t?.createAccountSubtitle}
            </p>
          </div>

          {/* Google Sign In — hidden once the not-verified panel is active
              (below): `auth.ts`'s Google signIn callback finds the just-
              created account by email and, since it already exists, never
              checks `emailVerified` at all — clicking it here would fully
              authenticate the unverified account, silently bypassing the
              verification gate this panel exists to enforce. */}
          {errorKind !== "notVerified" && (
            <>
              <Button
                className="h-14 w-full bg-[#f2f3f8] text-base text-neutral-800 hover:bg-[#e9ebf3] border-neutral-200"
                disabled={isLoading}
                onClick={handleGoogleSignIn}
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
                {t?.continueWithGoogle}
              </Button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-neutral-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-5 text-neutral-400">
                    {t?.orContinueWith}
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Not-verified panel — replaces the form while active */}
          {errorKind === "notVerified" ? (
            <div className="space-y-6">
              <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-medium text-amber-800">
                  {t?.notVerifiedTitle}
                </p>
                <p className="mt-1 text-sm text-amber-700">
                  {mode === "register"
                    ? (t?.registerCheckInbox ?? "").replace("{email}", email)
                    : t?.notVerifiedBody}
                </p>
              </div>
              <Button
                className="w-full"
                disabled={resendState === "sending"}
                onClick={handleResend}
                size="lg"
                type="button"
                variant="secondary"
              >
                {resendState === "sending"
                  ? t?.resending
                  : resendState === "sent"
                    ? t?.verificationResent
                    : t?.resendVerification}
              </Button>
            </div>
          ) : (
            <>
              {/* Error message */}
              {error && (
                <div
                  id="error-message"
                  className="mb-4 rounded-md border border-red-200 bg-red-50 p-4"
                  role="alert"
                >
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Form */}
              <form className="space-y-6" noValidate onSubmit={handleSubmit}>
                {/* Name field (only for register) */}
                {mode === "register" && (
                  <div>
                    <FormField
                      aria-describedby={error ? "error-message" : undefined}
                      autoComplete="name"
                      id="auth-name"
                      label={t?.nameLabel}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t?.namePlaceholder}
                      required
                      type="text"
                      value={name}
                    />
                  </div>
                )}

                <div>
                  <FormField
                    aria-describedby={error ? "error-message" : undefined}
                    autoComplete="email"
                    id="auth-email"
                    label={t?.email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t?.emailPlaceholder}
                    required
                    type="email"
                    value={email}
                  />
                </div>

                <div>
                  <FormField
                    aria-describedby={error ? "error-message" : undefined}
                    autoComplete={
                      mode === "register" ? "new-password" : "current-password"
                    }
                    id="auth-password"
                    label={t?.password}
                    minLength={6}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t?.passwordPolicyHint}
                    required
                    type="password"
                    value={password}
                  />
                </div>

                {mode === "register" && (
                  <div>
                    <FormSelectField
                      id="auth-referred-by-tripper"
                      label={t?.referredByLabel}
                      onChange={(e) =>
                        setReferredByTripperSlug(e.target.value)
                      }
                      required
                      value={referredByTripperSlug}
                    >
                      <option disabled value={NOT_DECIDED_VALUE}>
                        {t?.referredByPlaceholder}
                      </option>
                      <option value={NONE_OPTION_VALUE}>
                        {t?.referredByNoneOption}
                      </option>
                      {activeTrippers.map((tripper) => (
                        <option key={tripper.slug} value={tripper.slug}>
                          {tripper.name}
                        </option>
                      ))}
                    </FormSelectField>
                  </div>
                )}

                {mode === "login" && (
                  <div className="flex flex-col gap-2 pt-1">
                    <div className="flex items-center justify-between gap-2">
                      <label className="flex cursor-pointer items-center gap-2 text-md font-light text-[#344266]">
                        <input
                          checked={keepMeLoggedIn}
                          className="h-4 w-4 accent-cyan-600 border-neutral-200 cursor-pointer border-2 padding-px"
                          onChange={(event) =>
                            setKeepMeLoggedIn(event.target.checked)
                          }
                          type="checkbox"
                        />
                        {t?.keepLoggedIn}
                      </label>
                      {forgotState !== "sent" && (
                        <button
                          className="text-md font-light text-neutral-700 transition-colors hover:underline underline-offset-2 cursor-pointer hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={forgotState === "sending"}
                          onClick={handleForgotPassword}
                          type="button"
                        >
                          {forgotState === "sending"
                            ? t?.forgotSending
                            : t?.forgotPasswordLink}
                        </button>
                      )}
                    </div>
                    {forgotState === "sent" && (
                      <p className="text-sm font-light text-neutral-500">
                        {t?.forgotSentGeneric}
                      </p>
                    )}
                  </div>
                )}

                {/* Submit button */}
                <Button
                  className=" w-full"
                  disabled={isLoading}
                  size="lg"
                  type="submit"
                >
                  {isLoading
                    ? t?.loading
                    : mode === "login"
                      ? t?.signIn
                      : t?.createAccount}
                </Button>
              </form>
            </>
          )}

          {/* Toggle mode */}
          {allowRegister && (
            <div className="mt-6 text-center text-sm">
              <span className="text-neutral-600">
                {mode === "login" ? t?.noAccount : t?.haveAccount}
              </span>{" "}
              <button
                type="button"
                onClick={toggleMode}
                className="text-primary hover:text-primary/90 font-medium transition-colors hover:underline underline-offset-2 cursor-pointer"
              >
                {mode === "login" ? t?.signUp : t?.signIn}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
