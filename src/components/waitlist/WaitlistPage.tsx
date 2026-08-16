import { useState } from "react";

import { trackCustomEvent } from "@/lib/helpers/tracking/gtm";
import Img from "@/components/common/Img";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";

interface WaitlistDict {
  accessDeniedBody: string;
  accessDeniedTitle: string;
  ariaFacebook: string;
  ariaInstagram: string;
  ariaLinkedin: string;
  emailLabel: string;
  emailPlaceholder: string;
  errorMessage: string;
  headline: string;
  lastNameLabel: string;
  lastNamePlaceholder: string;
  loginAction: string;
  nameLabel: string;
  namePlaceholder: string;
  signOutLabel: string;
  subheadline: string;
  submitButton: string;
  successMessage: string;
}

interface WaitlistPageProps {
  /** True when a real session exists but the user's role isn't admin/tripper. */
  accessDenied?: boolean;
  dict: WaitlistDict;
  onOpenLogin: () => void;
  onSignOut?: () => void;
}

export function WaitlistPage({
  accessDenied = false,
  dict,
  onOpenLogin,
  onSignOut,
}: WaitlistPageProps) {
  const [email, setEmail] = useState("");
  const [lastName, setLastName] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setIsLoading(true);
    setStatus("idle");
    try {
      const res = await fetch("/api/waitlist", {
        body: JSON.stringify({
          email: email.trim(),
          lastName: lastName.trim(),
          name: name.trim(),
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      if (res.ok) {
        trackCustomEvent({ event: "waitlist_join" });
        setStatus("success");
        setEmail("");
        setLastName("");
        setName("");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="grid h-screen grid-cols-1 lg:grid-cols-2 rt-container">
      <div className="flex min-w-0 items-center justify-center px-6 pb-4 pt-10 md:px-12 md:pb-6 md:pt-14 lg:px-0 lg:py-6">
        <div className="mx-auto w-full max-w-md lg:mx-0 lg:w-auto lg:max-w-none">
          <Img
            alt="Randomtrip"
            className="h-auto w-full lg:h-40 lg:w-auto"
            src="/assets/svg/randomtrip.svg"
          />
        </div>
      </div>
      <div className="flex min-w-0 flex-col justify-center px-6 pb-10 pt-4 md:px-12 md:pb-14 md:pt-6 lg:px-16 lg:pb-6 xl:px-24">
        <div className="mx-auto w-full max-w-md">
          <h1 className="font-barlow-condensed text-3xl font-bold uppercase leading-none tracking-wide text-foreground md:text-4xl lg:text-5xl">
            {accessDenied ? dict.accessDeniedTitle : dict.headline}
          </h1>
          <p className="mt-4 text-muted-foreground md:text-lg">
            {accessDenied ? dict.accessDeniedBody : dict.subheadline}
          </p>
          {accessDenied ? (
            <Button
              className="mt-8 mx-auto"
              onClick={onSignOut}
              size="md"
              type="button"
              variant="secondary"
            >
              {dict.signOutLabel}
            </Button>
          ) : (
            <>
              {status !== "success" && (
                <form
                  className="mt-8 flex flex-col gap-4"
                  onSubmit={handleSubmit}
                >
                  <FormField
                    disabled={isLoading}
                    id="waitlist-name"
                    label={dict.nameLabel}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={dict.namePlaceholder}
                    type="text"
                    value={name}
                  />
                  <FormField
                    disabled={isLoading}
                    id="waitlist-last-name"
                    label={dict.lastNameLabel}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder={dict.lastNamePlaceholder}
                    type="text"
                    value={lastName}
                  />
                  <FormField
                    disabled={isLoading}
                    id="waitlist-email"
                    label={dict.emailLabel}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={dict.emailPlaceholder}
                    required
                    type="email"
                    value={email}
                  />
                  <Button
                    className="w-full"
                    disabled={isLoading}
                    size="lg"
                    type="submit"
                  >
                    {isLoading ? "..." : dict.submitButton}
                  </Button>
                </form>
              )}
              {status === "success" && (
                <p className="mt-4 text-sm font-medium text-green-600">
                  {dict.successMessage}
                </p>
              )}
              {status === "error" && (
                <p className="mt-4 text-sm font-medium text-destructive">
                  {dict.errorMessage}
                </p>
              )}
              <Button
                className="mt-8 mx-auto"
                onClick={onOpenLogin}
                size="md"
                type="button"
                variant="link"
              >
                <span>{dict.loginAction}</span>
              </Button>
            </>
          )}
          <div className="mt-10 flex justify-center gap-4">
            <a
              aria-label={dict.ariaFacebook}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-gray-500 transition-colors duration-300 hover:border-gray-300 hover:bg-gray-100 hover:text-gray-700"
              href="https://facebook.com/getrandomtrip"
              rel="noopener noreferrer"
              target="_blank"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </a>
            <a
              aria-label={dict.ariaInstagram}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-gray-500 transition-colors duration-300 hover:border-gray-300 hover:bg-gray-100 hover:text-gray-700"
              href="https://instagram.com/getrandomtrip"
              rel="noopener noreferrer"
              target="_blank"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
              </svg>
            </a>
            <a
              aria-label={dict.ariaLinkedin}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-gray-500 transition-colors duration-300 hover:border-gray-300 hover:bg-gray-100 hover:text-gray-700"
              href="https://www.linkedin.com/company/getrandomtrip"
              rel="noopener noreferrer"
              target="_blank"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
