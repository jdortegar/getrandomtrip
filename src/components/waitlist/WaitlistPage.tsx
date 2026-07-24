import { useState } from "react";

import Img from "@/components/common/Img";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";

interface WaitlistDict {
  accessDeniedBody: string;
  accessDeniedTitle: string;
  adminLoginLabel: string;
  emailLabel: string;
  emailPlaceholder: string;
  errorMessage: string;
  headline: string;
  lastNameLabel: string;
  lastNamePlaceholder: string;
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
      <div className="flex min-w-0 items-center justify-center py-4 md:py-6">
        <Img
          alt="Randomtrip"
          className="h-24 w-auto md:h-32 lg:h-40"
          src="/assets/svg/randomtrip.svg"
        />
      </div>
      <div className="flex min-w-0 flex-col justify-center px-6 py-4 md:px-12 md:py-6 lg:px-16 xl:px-24">
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
                {dict.adminLoginLabel}
              </Button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
