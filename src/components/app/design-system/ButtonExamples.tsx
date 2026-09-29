"use client";

import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
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
        <div className="bg-white border border-gray-200 p-6 rounded-xl">
          <h3 className="font-semibold mb-5 text-xl">
            {copy.buttons.variants}
          </h3>
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
        </div>
        <div className="bg-accent border border-gray-200 p-6 rounded-xl">
          <h3 className="font-semibold mb-5 text-xl">{copy.buttons.sizes}</h3>
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
        </div>
      </div>
      <div className="flex flex-wrap gap-5 items-center mt-6">
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
      <UsageExample
        code={`<Button onClick={handleAction} variant="default">{copy.action}</Button>
<Button disabled>{copy.unavailable}</Button>
<Button asChild variant="link"><a href="#controls">{copy.controls}</a></Button>`}
        label={copy.usage}
      />
    </>
  );
}
