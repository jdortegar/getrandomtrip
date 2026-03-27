"use client";

import { useState, useEffect, useCallback } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, X } from "lucide-react";
import type { Dictionary } from "@/lib/i18n/dictionaries";

interface AuthModalProps {
  defaultMode?: "login" | "register";
  dict?: Dictionary;
  onClose: () => void;
  isOpen: boolean;
}

const checkoutFormFieldClassName =
  "bg-gray-100 outline-none placeholder:text-gray-400 px-6 py-4 rounded-xl text-gray-900 w-full text-lg";

export default function AuthModal({
  defaultMode = "login",
  dict,
  isOpen,
  onClose,
}: AuthModalProps) {
  if (!isOpen) return null;

  const t = dict?.auth;
  const [mode, setMode] = useState<"login" | "register">(defaultMode);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [keepMeLoggedIn, setKeepMeLoggedIn] = useState(false);

  // Handle successful authentication - just close modal and let the page handle the next action
  const handleAuthSuccess = useCallback(() => {
    // Clear form state
    setName("");
    setEmail("");
    setPassword("");
    setError("");

    // Close modal
    onClose();

    // Let the page handle what happens next after authentication
    // No redirects - the page will detect the auth state change and proceed
  }, [onClose]);

  // Handle close - just close the modal, don't redirect
  const handleClose = useCallback(() => {
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
    if (!isOpen) return;
    const rememberedEmail = localStorage.getItem("auth-remember-email");
    if (!rememberedEmail) return;
    setEmail(rememberedEmail);
    setKeepMeLoggedIn(true);
  }, [isOpen]);

  const validateForm = () => {
    if (!email || !password) {
      setError(t?.fillAllFields ?? "");
      return false;
    }
    if (mode === "register" && !name) {
      setError(t?.nameRequired ?? "");
      return false;
    }
    if (password.length < 6) {
      setError(t?.passwordMinLength ?? "");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError(t?.invalidEmail ?? "");
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

    try {
      if (mode === "register") {
        // Register new user
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || (t?.loginFailed ?? ""));
        }

        // Auto-login after successful registration
        const result = await signIn("credentials", {
          email,
          rememberMe: keepMeLoggedIn ? "true" : "false",
          password,
          redirect: false,
        });

        if (result?.error) {
          throw new Error(t?.loginFailed ?? "");
        }

        // Handle successful authentication
        handleAuthSuccess();
      } else {
        // Login existing user
        const result = await signIn("credentials", {
          email,
          rememberMe: keepMeLoggedIn ? "true" : "false",
          password,
          redirect: false,
        });

        if (result?.error) {
          throw new Error(t?.loginFailed ?? "");
        }

        // Handle successful authentication
        if (keepMeLoggedIn) {
          localStorage.setItem("auth-remember-email", email);
        } else {
          localStorage.removeItem("auth-remember-email");
        }
        handleAuthSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : (t?.loginFailed ?? ""));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = useCallback(async () => {
    // Use current page as callback - let the page handle what happens next
    await signIn("google", { callbackUrl: window.location.href });
  }, []);

  const toggleMode = useCallback(() => {
    setMode(mode === "login" ? "register" : "login");
    setError("");
  }, [mode]);

  const handleForgotPassword = useCallback(() => {
    if (!email) {
      setError(t?.invalidEmail ?? "");
      return;
    }
    const subject = encodeURIComponent(t?.forgotPasswordSubject ?? "");
    const body = encodeURIComponent(
      (t?.forgotPasswordBody ?? "").replace("{email}", email),
    );
    window.location.href = `mailto:support@getrandomtrip.com?subject=${subject}&body=${body}`;
  }, [email, t?.forgotPasswordBody, t?.forgotPasswordSubject, t?.invalidEmail]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div className="relative w-full max-w-md bg-white rounded-lg shadow-2xl border border-gray-200">
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

          {/* Google Sign In */}
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
                <label className="mb-2 block text-lg font-barlow font-medium text-gray-900">
                  {t?.nameLabel}
                </label>
                <Input
                  aria-describedby={error ? "error-message" : undefined}
                  autoComplete="name"
                  className="h-14 rounded-xl border-neutral-200 bg-white px-5 placeholder:text-neutral-300"
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t?.namePlaceholder}
                  required
                  type="text"
                  value={name}
                />
              </div>
            )}

            <div>
              <label className="mb-2 block text-lg font-barlow font-medium text-gray-900">
                {t?.email}
              </label>
              <Input
                aria-describedby={error ? "error-message" : undefined}
                autoComplete="email"
                className="h-14 rounded-lg border-neutral-200 bg-white px-5 placeholder:text-neutral-300"
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t?.emailPlaceholder}
                required
                type="email"
                value={email}
              />
            </div>

            <div>
              <label className="mb-2 block text-lg font-barlow- font-medium text-[#2e3f66]">
                {t?.password}
              </label>
              <div className="relative">
                <Input
                  aria-describedby={error ? "error-message" : undefined}
                  autoComplete={
                    mode === "register" ? "new-password" : "current-password"
                  }
                  className="h-14 rounded-xl border-neutral-200 bg-white px-5 pr-12 placeholder:text-neutral-300"
                  minLength={6}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters + special character"
                  required
                  type={isPasswordVisible ? "text" : "password"}
                  value={password}
                />
                <button
                  aria-label={
                    isPasswordVisible ? "Hide password" : "Show password"
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 transition-colors hover:text-neutral-700"
                  onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                  type="button"
                >
                  {isPasswordVisible ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {mode === "login" && (
              <div className="flex items-center justify-between pt-1">
                <label className="flex cursor-pointer items-center gap-2 text-md font-light text-[#344266]">
                  <input
                    checked={keepMeLoggedIn}
                    className="h-5 w-5 accent-cyan-600 border-neutral-200"
                    onChange={(event) =>
                      setKeepMeLoggedIn(event.target.checked)
                    }
                    type="checkbox"
                  />
                  Keep me logged in
                </label>
                <button
                  className="text-md font-light text-neutral-700 transition-colors hover:underline underline-offset-2 cursor-pointer hover:text-neutral-900"
                  onClick={handleForgotPassword}
                  type="button"
                >
                  Forgot password?
                </button>
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

          {/* Toggle mode */}
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
        </div>
      </div>
    </div>
  );
}
