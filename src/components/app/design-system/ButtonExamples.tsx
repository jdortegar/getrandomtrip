"use client";

import { useState } from "react";
import { ArrowDown, ArrowUpRight, Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ButtonV2 } from "@/components/ui/ButtonV2";
import { GalleryPanel } from "@/components/app/design-system/GalleryPanel";
import { UsageExample } from "@/components/app/design-system/UsageExample";
import type { DesignSystemDict } from "@/lib/types/dictionary";
import { cn } from "@/lib/utils";

interface ButtonExamplesProps {
  copy: DesignSystemDict;
}
const variants = [
  "default",
  "secondary",
  "pill",
  "ghost",
  "link",
  "destructive",
] as const;
const sizes = ["sm", "md", "lg"] as const;

export function ButtonExamples({ copy }: ButtonExamplesProps) {
  const [feedback, setFeedback] = useState("");
  const handleAction = (label: string) =>
    setFeedback(copy.buttons.feedback.replace("{action}", label));
  return (
    <>
      <div className={cn("gap-6 grid", "lg:grid-cols-2")}>
        <GalleryPanel title={copy.buttons.variants}>
          <div className="flex flex-wrap gap-4 items-center">
            {variants.map((variant) => (
              <Button
                key={variant}
                onClick={() => handleAction(copy.buttons.labels[variant])}
                type="button"
                variant={variant}
              >
                {copy.buttons.labels[variant]}
              </Button>
            ))}
          </div>
        </GalleryPanel>
        <GalleryPanel
          className="bg-accent"
          title={copy.buttons.sizes}
        >
          <div className="flex flex-wrap gap-4 items-center">
            {sizes.map((size) => (
              <Button
                key={size}
                onClick={() => handleAction(copy.buttons.sizeLabels[size])}
                size={size}
                type="button"
              >
                {copy.buttons.sizeLabels[size]}
              </Button>
            ))}
          </div>
        </GalleryPanel>
      </div>
      <GalleryPanel className="mt-6">
        <div className="flex flex-wrap gap-5 items-center">
          <Button disabled type="button">
            {copy.buttons.disabled}
          </Button>
          <Button asChild variant="link">
            <a href="#controls">
              {copy.buttons.navigation}
              <ArrowUpRight aria-hidden className="h-4 w-4" />
            </a>
          </Button>
        </div>
        <p className="min-h-6 mt-4 text-primary text-sm" role="status">
          {feedback || copy.buttons.hint}
        </p>
      </GalleryPanel>
      <GalleryPanel className="mt-6" title={copy.buttons.v2.title}>
        <div className="flex flex-wrap gap-4 items-center">
          <ButtonV2 onClick={() => handleAction(copy.buttons.v2.labels.primary)} type="button">
            {copy.buttons.v2.labels.primary}
            <ArrowDown aria-hidden />
          </ButtonV2>
          <ButtonV2 onClick={() => handleAction(copy.buttons.v2.labels.outline)} type="button" variant="outline">
            {copy.buttons.v2.labels.outline}
          </ButtonV2>
          <ButtonV2 onClick={() => handleAction(copy.buttons.v2.labels.small)} size="sm" type="button">
            {copy.buttons.v2.labels.small}
          </ButtonV2>
          <ButtonV2
            aria-label={copy.buttons.v2.labels.icon}
            onClick={() => handleAction(copy.buttons.v2.labels.icon)}
            size="icon"
            type="button"
            variant="outline"
          >
            <Download aria-hidden />
          </ButtonV2>
        </div>
        <div className="bg-primary mt-5 p-6">
          <ButtonV2 onClick={() => handleAction(copy.buttons.v2.labels.light)} type="button" variant="light">
            {copy.buttons.v2.labels.light}
            <ArrowDown aria-hidden />
          </ButtonV2>
        </div>
        <p className="mt-4 text-neutral-600 text-sm">{copy.buttons.v2.hint}</p>
      </GalleryPanel>
      <UsageExample
        code={`<Button onClick={handleAction} variant="default">{copy.action}</Button>
<Button disabled>{copy.unavailable}</Button>
<Button asChild variant="link"><a href="#controls">{copy.controls}</a></Button>`}
        label={copy.usage}
      />
    </>
  );
}
