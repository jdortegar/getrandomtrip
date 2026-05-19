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

    const parsed = parseXsedNotificationBody({ email, locale });
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

  return (
    <motion.div
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, delay: 1.2 }}
      className={cn(isDark ? "" : "flex flex-col items-center text-center")}
    >
      <form
        className={cn(
          "flex gap-4 mb-4",
          isDark
            ? "flex-col md:flex-row justify-start"
            : "flex-col sm:flex-row justify-center w-full max-w-2xl",
        )}
        noValidate
        onSubmit={handleSubmit}
      >
        <Input
          aria-label={content.inputLabel}
          className={cn(
            "h-14 rounded-md px-4 font-barlow text-lg font-semibold shadow-none",
            isDark
              ? "w-full md:w-[300px] border-2 border-white bg-transparent text-white placeholder:text-white focus-visible:ring-2 focus-visible:ring-white/40"
              : "flex-1 border border-neutral-300 bg-white text-neutral-800 placeholder:text-neutral-400 focus-visible:ring-2 focus-visible:ring-xsed/40",
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
          disabled={isSubmitting}
          size="lg"
          type="submit"
          variant="tertiary"
        >
          {isSubmitting ? content.submittingLabel : content.submitLabel}
        </Button>
      </form>

      {statusMessage && (
        <p
          className={cn(
            "mb-4 font-barlow text-lg font-semibold",
            status === "success" ? "text-emerald-500!" : "text-red-500!",
          )}
        >
          {statusMessage}
        </p>
      )}

      <p
        className={cn(
          "font-barlow text-base leading-relaxed [&_strong]:font-bold",
          isDark ? "text-white" : "text-neutral-500",
        )}
        dangerouslySetInnerHTML={{ __html: content.helper }}
      />
    </motion.div>
  );
}
