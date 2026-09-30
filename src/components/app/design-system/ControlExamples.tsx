"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { FormField, FormSelectField } from "@/components/ui/FormField";
import { FormValidationScope } from "@/components/ui/FormValidationScope";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { Switch } from "@/components/ui/Switch";
import { TextAreaInput } from "@/components/ui/TextAreaInput";
import { UsageExample } from "@/components/app/design-system/UsageExample";
import type { DesignSystemDict } from "@/lib/types/dictionary";
import { cn } from "@/lib/utils";

interface ControlExamplesProps {
  copy: DesignSystemDict;
}

export function ControlExamples({ copy }: ControlExamplesProps) {
  const [invalid, setInvalid] = useState(false);
  const [focusRequest, setFocusRequest] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [notes, setNotes] = useState("");
  const [updates, setUpdates] = useState(false);
  const [quantity, setQuantity] = useState(2);
  const labels = copy.controls;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = event.currentTarget.elements.namedItem(
      "email",
    ) as HTMLInputElement;
    const isInvalid = !input.validity.valid;
    setInvalid(isInvalid);
    setSubmitted(!isInvalid);
    if (isInvalid) setFocusRequest((value) => value + 1);
  }

  return (
    <>
      <div className={cn("gap-6 grid", "lg:grid-cols-2")}>
        <form
          className="bg-white border border-gray-200 p-6 rounded-xl space-y-5"
          noValidate
          onSubmit={handleSubmit}
        >
          <h3 className="font-semibold text-xl">{labels.formTitle}</h3>
          <p className="text-neutral-600 text-sm" id="demo-email-hint">
            {labels.hint}
          </p>
          <FormValidationScope
            errors={invalid ? [{ path: "email", code: "invalid" }] : []}
            focusRequest={focusRequest}
            messages={{ invalid: labels.error }}
          >
            <FormField
              aria-describedby="demo-email-hint"
              autoComplete="off"
              id="demo-email"
              label={labels.email}
              name="email"
              onChange={() => {
                setInvalid(false);
                setSubmitted(false);
              }}
              placeholder={labels.emailPlaceholder}
              required
              type="email"
            />
          </FormValidationScope>
          <TextAreaInput
            id="demo-notes"
            label={labels.notes}
            maxLength={120}
            onChange={(event) => setNotes(event.target.value)}
            placeholder={labels.notesPlaceholder}
            value={notes}
          />
          <Button type="submit">{labels.validate}</Button>
          <p className="min-h-6 text-primary text-sm" role="status">
            {submitted ? labels.success : labels.localOnly}
          </p>
        </form>
        <div className="bg-white border border-gray-200 p-6 rounded-xl space-y-5">
          <h3 className="font-semibold text-xl">{labels.states}</h3>
          <FormField
            id="demo-readonly"
            label={labels.readOnly}
            readOnly
            value={labels.readOnlyValue}
          />
          <FormField
            disabled
            id="demo-disabled"
            label={labels.disabled}
            value={labels.disabledValue}
          />
          <FormSelectField
            defaultValue="flexible"
            id="demo-pace"
            label={labels.pace}
          >
            <option value="flexible">{labels.flexible}</option>
            <option value="slow">{labels.slow}</option>
            <option value="active">{labels.active}</option>
          </FormSelectField>
          <div className="flex gap-4 items-center justify-between min-h-11">
            <label
              className="cursor-pointer py-3 text-sm"
              htmlFor="demo-updates"
            >
              {labels.updates}
            </label>
            <Switch
              checked={updates}
              id="demo-updates"
              onCheckedChange={setUpdates}
            />
          </div>
          <QuantityStepper
            ariaDecrease={labels.decrease}
            ariaIncrease={labels.increase}
            label={labels.travelers}
            max={6}
            min={1}
            onValueChange={setQuantity}
            value={quantity}
          />
        </div>
      </div>
      <UsageExample
        code={`<FormField id="email" label={copy.email} name="email" required type="email" />
<TextAreaInput id="notes" label={copy.notes} onChange={handleChange} value={notes} />
<Switch checked={updates} id="updates" onCheckedChange={setUpdates} />`}
        label={copy.usage}
      />
    </>
  );
}
