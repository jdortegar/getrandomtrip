"use client";

import { FormEvent, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormField, FormSelectField } from "@/components/ui/FormField";
import { TextAreaInput } from "@/components/ui/TextAreaInput";
import type { MarketingDictionary } from "@/lib/types/dictionary";

const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;

interface ContactFormProps {
  copy: MarketingDictionary["contactPage"]["form"];
  onSuccess?: () => void;
}

export function ContactForm({ copy, onSuccess }: ContactFormProps) {
  const params = useParams();
  const locale = (params?.locale as string) ?? "es";
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentError, setAttachmentError] = useState("");
  const [email, setEmail] = useState("");
  const [interest, setInterest] = useState("trips");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleAttachmentSelect(file: File | undefined) {
    if (!file) return;
    if (file.size > MAX_ATTACHMENT_BYTES) {
      setAttachmentError(copy.attachmentTooLarge);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setAttachmentError("");
    setAttachment(file);
  }

  function handleAttachmentRemove() {
    setAttachment(null);
    setAttachmentError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const form = event.currentTarget;
    const source = new FormData(form);
    const payload = new FormData();
    payload.set("email", String(source.get("email") || "").trim());
    payload.set("interest", String(source.get("interest") || "trips").trim());
    payload.set("message", String(source.get("message") || "").trim());
    payload.set("name", String(source.get("name") || "").trim());
    payload.set("locale", locale);
    if (attachment) payload.set("attachment", attachment);

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/contact", {
        body: payload,
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
        onChange={(event) => {
          setInterest(event.target.value);
          if (event.target.value !== "cancellation") handleAttachmentRemove();
        }}
        required
        value={interest}
      >
        <option value="trips">{copy.interestOptions.trips}</option>
        <option value="cancellation">
          {copy.interestOptions.cancellation}
        </option>
        <option value="collaboration">
          {copy.interestOptions.collaboration}
        </option>
        <option value="partnerships">
          {copy.interestOptions.partnerships}
        </option>
        <option value="other">{copy.interestOptions.other}</option>
      </FormSelectField>
      {interest === "cancellation" && (
        <div className="flex flex-col gap-2">
          <label
            className="block font-normal text-gray-600 text-base"
            htmlFor="contact-attachment"
          >
            {copy.attachment}
          </label>
          {attachment ? (
            <div className="flex items-center justify-between gap-3 rounded-xl bg-gray-100 px-6 py-4">
              <span className="flex min-w-0 items-center gap-2 text-sm text-gray-900">
                <Paperclip className="h-4 w-4 shrink-0" />
                <span className="truncate">{attachment.name}</span>
              </span>
              <button
                aria-label={copy.removeAttachment}
                className="shrink-0 text-neutral-400 transition-colors hover:text-neutral-700"
                onClick={handleAttachmentRemove}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 px-6 py-4 text-sm text-gray-500 transition-colors hover:border-gray-400 hover:text-gray-700"
              onClick={() => fileInputRef.current?.click()}
              type="button"
            >
              <Paperclip className="h-4 w-4" />
              {copy.attachment}
            </button>
          )}
          <p className="text-xs text-neutral-400">{copy.attachmentHint}</p>
          {attachmentError && (
            <p className="text-xs text-red-600">{attachmentError}</p>
          )}
          <input
            accept="image/*,.pdf,.doc,.docx"
            className="sr-only"
            id="contact-attachment"
            onChange={(event) => handleAttachmentSelect(event.target.files?.[0])}
            ref={fileInputRef}
            type="file"
          />
        </div>
      )}
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
