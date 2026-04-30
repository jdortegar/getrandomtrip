"use client";

import { motion } from "framer-motion";
import { useState, type FormEvent } from "react";

import VideoBackground from "@/components/media/VideoBackground";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import type { XsedPageDict } from "@/lib/types/dictionary";
import { formatTitleWithCopyright } from "@/lib/helpers/stringHelpers";
import { cn } from "@/lib/utils";
import { parseXsedNotificationBody } from "@/lib/xsed/notifications";

interface SecondaryHeroProps {
  className?: string;
  content: XsedPageDict["hero"];
  id?: string;
  locale: string;
  scrollIndicator?: boolean;
  titleClassName?: string;
}

type SubmitStatus = "idle" | "error" | "invalid" | "success";

export function SecondaryHero({
  className,
  content,
  id,
  locale,
  scrollIndicator = false,
  titleClassName,
}: SecondaryHeroProps) {
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

  return (
    <section
      className={cn(
        "relative flex h-screen flex-col overflow-hidden",
        className,
      )}
      id={id || "secondary-hero"}
    >
      <div
        aria-hidden
        className="absolute left-0 top-0 h-px w-px"
        id="hero-sentinel"
      />
      <VideoBackground
        fallbackImage={content.fallbackImage}
        videoSrc={content.videoSrc}
      />
      <div className="relative z-10 flex flex-col justify-center h-full container mx-auto md:px-20 px-4">
        <div className="max-w-3xl flex flex-col justify-center text-left">
          <motion.div
            className={cn("flex gap-5 items-end mb-8 text-white")}
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <h2 className="font-barlow-condensed font-extrabold text-[80px] md:text-[130px] z-10 leading-[0.8] [&_sup]:text-[0.6em]">
              {formatTitleWithCopyright(content.title)}
            </h2>
            <p
              className="font-barlow font-medium leading-none text-lg whitespace-pre-line"
              dangerouslySetInnerHTML={{ __html: content.subtitle }}
            />
          </motion.div>

          <motion.p
            className="font-barlow text-lg leading-relaxed text-white mb-8 [&_strong]:font-bold"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            dangerouslySetInnerHTML={{ __html: content.tagline }}
          />
        </div>

        <motion.form
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.2 }}
          className="flex flex-col md:flex-row justify-start gap-4  mb-8"
          noValidate
          onSubmit={handleSubmit}
        >
          <Input
            aria-label={content.inputLabel}
            className="h-14 w-[300px] rounded-md border-2 border-white bg-transparent px-4 font-barlow text-lg font-semibold text-white shadow-none placeholder:text-white focus-visible:ring-2 focus-visible:ring-white/40"
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
        </motion.form>

        {statusMessage && (
          <p
            className={cn(
              "mb-6 font-barlow text-lg font-semibold",
              status === "success" ? "text-emerald-500!" : "text-red-500!",
            )}
          >
            {statusMessage}
          </p>
        )}

        <motion.p
          className="font-barlow text-lg leading-relaxed text-white mb-8 [&_strong]:font-bold"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.6 }}
          dangerouslySetInnerHTML={{ __html: content.helper }}
        />
      </div>

      {scrollIndicator && (
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
          <div
            className="scroll-indicator pointer-events-none select-none z-10 text-white"
            aria-hidden="true"
          >
            "SCROLL"
          </div>
        </div>
      )}
    </section>
  );
}
