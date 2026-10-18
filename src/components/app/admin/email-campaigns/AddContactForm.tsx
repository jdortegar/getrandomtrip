"use client";

import { useRef, useState, type FormEvent } from "react";
import { Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormField, FormSelectField } from "@/components/ui/FormField";
import type { EmailCampaignsAdminDict } from "@/lib/types/dictionary";
import { isValidEmail } from "@/lib/validation/email";
import type {
  CampaignLocale,
  FriendsFamilyContactInput,
} from "@/types/emailCampaign";

type Feedback = { kind: "error" | "success"; message: string } | null;

interface AddContactFormProps {
  copy: EmailCampaignsAdminDict["contacts"]["form"];
  defaultLocale: CampaignLocale;
  localeLabels: EmailCampaignsAdminDict["locales"];
  /** Called after the contact was created so the list can refresh. */
  onCreated: () => void;
}

function parseTags(raw: string): string[] {
  return raw
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

/** Adds one FRIENDS_FAMILY contact through the admin contacts API. */
export function AddContactForm({
  copy,
  defaultLocale,
  localeLabels,
  onCreated,
}: AddContactFormProps) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [locale, setLocale] = useState<CampaignLocale>(defaultLocale);
  const [tags, setTags] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const inFlight = useRef(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;
    const trimmedEmail = email.trim();
    if (!isValidEmail(trimmedEmail)) {
      setFeedback({ kind: "error", message: copy.errors.invalidEmail });
      return;
    }

    const payload: FriendsFamilyContactInput = {
      email: trimmedEmail,
      locale,
      name: name.trim() || null,
      tags: parseTags(tags),
    };
    inFlight.current = true;
    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/email-campaigns/contacts", {
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      if (res.ok) {
        setEmail("");
        setName("");
        setTags("");
        setFeedback({ kind: "success", message: copy.success });
        onCreated();
        return;
      }
      setFeedback({
        kind: "error",
        message:
          res.status === 409
            ? copy.errors.duplicate
            : res.status === 400
              ? copy.errors.invalid
              : copy.errors.generic,
      });
    } catch {
      setFeedback({ kind: "error", message: copy.errors.generic });
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  }

  return (
    <form
      className="space-y-5 rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
      data-component="AddContactForm"
      noValidate
      onSubmit={(event) => void handleSubmit(event)}
    >
      <div>
        <h3 className="text-xl font-semibold text-ink">{copy.title}</h3>
        <p className="mt-1 text-xs text-neutral-500">{copy.description}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <FormField
          autoComplete="off"
          id="email-contact-email"
          label={copy.email}
          onChange={(event) => setEmail(event.target.value)}
          required
          type="email"
          value={email}
        />
        <FormField
          autoComplete="off"
          id="email-contact-name"
          label={copy.name}
          maxLength={120}
          onChange={(event) => setName(event.target.value)}
          value={name}
        />
        <FormSelectField
          id="email-contact-locale"
          label={copy.locale}
          onChange={(event) => setLocale(event.target.value as CampaignLocale)}
          value={locale}
        >
          <option value="es">{localeLabels.es}</option>
          <option value="en">{localeLabels.en}</option>
        </FormSelectField>
        <FormField
          autoComplete="off"
          id="email-contact-tags"
          label={copy.tags}
          onChange={(event) => setTags(event.target.value)}
          placeholder={copy.tagsPlaceholder}
          value={tags}
        />
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <Button
          aria-busy={submitting}
          className="h-11 rounded-sm border-2 border-primary bg-primary px-6 text-sm font-semibold uppercase tracking-[1.5px] text-white hover:bg-primary-800"
          disabled={submitting}
          type="submit"
        >
          {submitting ? (
            <Loader2 aria-hidden className="h-4 w-4 animate-spin" />
          ) : (
            <UserPlus aria-hidden className="h-4 w-4" />
          )}
          {submitting ? copy.submitting : copy.submit}
        </Button>
        {feedback && (
          <p
            className={
              feedback.kind === "error"
                ? "text-sm text-red-600"
                : "text-sm text-green-700"
            }
            role={feedback.kind === "error" ? "alert" : "status"}
          >
            {feedback.message}
          </p>
        )}
      </div>
    </form>
  );
}
