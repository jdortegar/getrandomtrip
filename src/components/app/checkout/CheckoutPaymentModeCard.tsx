"use client";

import { Loader2 } from "lucide-react";
import Chip from "@/components/Chip";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import type { CheckoutPaymentSplit } from "@/lib/types/CheckoutQuote";
import { cn } from "@/lib/utils";

type PaymentMode = CheckoutPaymentSplit["paymentMode"];

interface CheckoutPaymentModeCardProps {
  copy: Dictionary["journey"]["checkout"]["paymentMode"];
  mode: PaymentMode;
  /** One per adult companion, in order. */
  emails: string[];
  onModeChange: (mode: PaymentMode) => void;
  onEmailChange: (index: number, value: string) => void;
  onCalculate: () => void;
  calculating: boolean;
  disabled: boolean;
  emailsError: string | null;
  /** Present once an INDIVIDUAL quote is ready. Amounts in USD. */
  share: { yours: number; companion: number; maxTopUp: number } | null;
  deadlineHours: number;
  disclaimerAccepted: boolean;
  onDisclaimerChange: (accepted: boolean) => void;
  showDisclaimerError: boolean;
  usd: (amount: number) => string;
}

export function CheckoutPaymentModeCard({
  copy,
  mode,
  emails,
  onModeChange,
  onEmailChange,
  onCalculate,
  calculating,
  disabled,
  emailsError,
  share,
  deadlineHours,
  disclaimerAccepted,
  onDisclaimerChange,
  showDisclaimerError,
  usd,
}: CheckoutPaymentModeCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-6 rounded-2xl bg-white p-5 shadow-md",
        "ring-1 ring-gray-100",
      )}
      data-component="CheckoutPaymentModeCard"
    >
      <div className="flex flex-col gap-2">
        <h2 className="font-barlow-condensed text-4xl font-bold uppercase">
          {copy.title}
        </h2>
        <p className="text-sm text-gray-500">{copy.description}</p>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label={copy.title}>
        <Chip
          active={mode === "TOTAL"}
          disabled={disabled}
          onClick={() => onModeChange("TOTAL")}
          size="touch"
        >
          {copy.totalOption}
        </Chip>
        <Chip
          active={mode === "INDIVIDUAL"}
          disabled={disabled}
          onClick={() => onModeChange("INDIVIDUAL")}
          size="touch"
        >
          {copy.individualOption}
        </Chip>
      </div>

      {mode === "INDIVIDUAL" ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h3 className="text-xl font-semibold text-ink">{copy.emailsTitle}</h3>
            <p className="text-sm text-gray-500">{copy.emailsHint}</p>
          </div>
          {emails.map((email, index) => (
            <FormField
              autoComplete="off"
              disabled={disabled}
              id={`checkout-companion-email-${index}`}
              key={index}
              label={copy.emailLabel.replace("{n}", String(index + 1))}
              onChange={(e) => onEmailChange(index, e.target.value)}
              type="email"
              value={email}
            />
          ))}
          {emailsError ? (
            <p className="text-sm text-red-600" role="alert">
              {emailsError}
            </p>
          ) : null}
          <Button
            aria-busy={calculating}
            className="self-start"
            disabled={disabled || calculating}
            onClick={onCalculate}
            type="button"
            variant="secondary"
          >
            {calculating ? (
              <>
                <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
                {copy.calculating}
              </>
            ) : (
              copy.calculate
            )}
          </Button>

          {share ? (
            <>
              <dl className="flex flex-col gap-2 border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-sm font-medium text-neutral-500">
                    {copy.yourShareLabel}
                  </dt>
                  <dd className="font-barlow-condensed text-3xl font-bold text-ink">
                    {usd(share.yours)}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-sm font-medium text-neutral-500">
                    {copy.companionShareLabel}
                  </dt>
                  <dd className="font-barlow-condensed text-lg font-bold leading-none text-ink">
                    {usd(share.companion)}
                  </dd>
                </div>
              </dl>
              <label className="flex items-start gap-2 text-xs leading-relaxed text-neutral-600">
                <input
                  checked={disclaimerAccepted}
                  className="mt-0.5"
                  disabled={disabled}
                  onChange={(e) => onDisclaimerChange(e.target.checked)}
                  type="checkbox"
                />
                <span>
                  {copy.disclaimer
                    .replace("{hours}", String(deadlineHours))
                    .replace("{max}", usd(share.maxTopUp))}
                </span>
              </label>
              {showDisclaimerError ? (
                <p className="text-sm text-red-600" role="alert">
                  {copy.disclaimerRequired}
                </p>
              ) : null}
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
