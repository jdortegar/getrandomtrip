"use client";

import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { parseXsedNotificationBody } from "@/lib/xsed/notifications";
import { useDictionary, useLocale } from "@/hooks/useDictionary";

interface XsedNotifyFormProps {
  variant?: "dark" | "light";
}

type SubmitStatus = "idle" | "error" | "invalid" | "success";

export function XsedNotifyForm({ variant = "dark" }: XsedNotifyFormProps) {
  const content = useDictionary((d) => d.xsedPage.hero);
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<SubmitStatus>("idle");

  const statusMessage =
    status === "success"
      ? content.successMessage
      : status === "invalid"
        ? content.invalidEmailMessage
        : status === "error"
          ? content.errorMessage
          : null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const parsed = parseXsedNotificationBody({ email, locale, timezone });
    if (!parsed) {
      setStatus("invalid");
      return;
    }

    setIsSubmitting(true);
    setStatus("idle");
    try {
      const response = await fetch("/api/xsed/notifications", {
        body: JSON.stringify(parsed),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });

      if (!response.ok) {
        setStatus("error");
        return;
      }

      setEmail("");
      setStatus("success");
    } catch {
      setStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  }

  const isDark = variant === "dark";

  const inputColorClasses = isDark
    ? "border-white bg-transparent text-white placeholder:text-white focus-visible:ring-white/40"
    : "border-neutral-300 bg-white text-neutral-800 placeholder:text-neutral-400 focus-visible:ring-xsed/40";

  const helperColorClasses = isDark ? "text-white" : "text-neutral-500";

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl"
      initial={{ opacity: 0, y: 40 }}
      transition={{ delay: 1.2, duration: 0.6 }}
    >
      <form
        className="mb-4 flex w-full flex-col justify-center gap-4 md:flex-row md:items-center"
        noValidate
        onSubmit={handleSubmit}
      >
        <Input
          aria-label={content.inputLabel}
          className={cn(
            "h-14 w-full rounded-md border-2 px-4 font-barlow text-lg font-semibold shadow-none focus-visible:ring-2 md:w-[300px]",
            inputColorClasses,
          )}
          disabled={isSubmitting}
          id="xsed-email-input"
          onChange={(event) => {
            setEmail(event.target.value);
            if (status !== "idle") setStatus("idle");
          }}
          placeholder={content.inputPlaceholder}
          required
          type="email"
          value={email}
        />
        <Button
          aria-label={content.submitAriaLabel}
          className="w-full md:w-auto"
          disabled={isSubmitting}
          size="lg"
          type="submit"
          variant="tertiary"
        >
          {isSubmitting ? content.submittingLabel : content.submitLabel}
        </Button>
      </form>

      {statusMessage ? (
        <p
          className={cn(
            "mb-4 font-barlow text-lg font-semibold",
            status === "success" ? "text-emerald-500!" : "text-red-500!",
          )}
        >
          {statusMessage}
        </p>
      ) : null}

      <p
        className={cn(
          "font-barlow text-base leading-relaxed [&_strong]:font-bold",
          helperColorClasses,
        )}
        dangerouslySetInnerHTML={{ __html: content.helper }}
      />
    </motion.div>
  );
}
