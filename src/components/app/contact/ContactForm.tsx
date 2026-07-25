"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormField, FormSelectField } from "@/components/ui/FormField";
import { TextAreaInput } from "@/components/ui/TextAreaInput";
import type { MarketingDictionary } from "@/lib/types/dictionary";

interface ContactFormProps {
  copy: MarketingDictionary["contactPage"]["form"];
  onSuccess?: () => void;
}

export function ContactForm({ copy, onSuccess }: ContactFormProps) {
  const [email, setEmail] = useState("");
  const [interest, setInterest] = useState("trips");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      email: String(formData.get("email") || "").trim(),
      interest: String(formData.get("interest") || "trips").trim(),
      message: String(formData.get("message") || "").trim(),
      name: String(formData.get("name") || "").trim(),
    };

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/contact", {
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      if (!response.ok) {
        console.error("Failed to send contact email");
        return;
      }

      onSuccess?.();
    } catch (error) {
      console.error("Contact form submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      className="space-y-5 rounded-xl bg-transparent"
      onSubmit={handleSubmit}
    >
      <FormField
        id="contact-name"
        label={copy.name}
        name="name"
        onChange={(event) => setName(event.target.value)}
        required
        type="text"
        value={name}
      />
      <FormField
        id="contact-email"
        label={copy.email}
        name="email"
        onChange={(event) => setEmail(event.target.value)}
        required
        type="email"
        value={email}
      />
      <FormSelectField
        id="contact-interest"
        label={copy.interest}
        name="interest"
        onChange={(event) => setInterest(event.target.value)}
        required
        value={interest}
      >
        <option value="trips">{copy.interestOptions.trips}</option>
        <option value="collaboration">
          {copy.interestOptions.collaboration}
        </option>
        <option value="partnerships">
          {copy.interestOptions.partnerships}
        </option>
        <option value="other">{copy.interestOptions.other}</option>
      </FormSelectField>
      <TextAreaInput
        id="contact-message"
        label={copy.message}
        name="message"
        onChange={(event) => setMessage(event.target.value)}
        required
        value={message}
      />
      <Button
        className="w-full"
        disabled={isSubmitting}
        size="md"
        type="submit"
        variant="default"
      >
        {copy.submit}
      </Button>
    </form>
  );
}
