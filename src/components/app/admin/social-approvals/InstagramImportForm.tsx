"use client";
import { useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormField, FormSelectField } from "@/components/ui/FormField";
import { TextAreaInput } from "@/components/ui/TextAreaInput";
import type { SocialImportCopy } from "@/lib/types/SocialImportCopy";
export function InstagramImportForm({ copy }: { copy: SocialImportCopy }) {
  const [url, setUrl] = useState("");
  const [assignment, setAssignment] = useState("unlocked");
  const [caption, setCaption] = useState("");
  const [headline, setHeadline] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const [checking, setChecking] = useState(false);
  const [checkMessage, setCheckMessage] = useState("");
  const [checkFailed, setCheckFailed] = useState(false);
  const checkingRef = useRef(false);
  async function handleCheck() {
    if (pending || checkingRef.current) return;
    checkingRef.current = true;
    setChecking(true);
    setCheckMessage("");
    setCheckFailed(false);
    try {
      const response = await fetch("/api/admin/social-approvals/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const result = (await response.json()) as { reason?: string };
      if (!response.ok) throw new Error("check_failed");
      setCheckMessage(
        result.reason === "BASELINE_REQUIRED"
          ? copy.checkBaseline
          : copy.checked,
      );
    } catch {
      setCheckFailed(true);
      setCheckMessage(copy.checkError);
    } finally {
      checkingRef.current = false;
      setChecking(false);
    }
  }
  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (pending || checkingRef.current) return;
    setPending(true);
    setMessage("");
    setFailed(false);
    try {
      const response = await fetch("/api/admin/social-approvals/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instagramUrl: url,
          useReviewedExample: assignment === "reviewed",
          copyLocks: {
            ...(caption.trim() ? { caption } : {}),
            ...(headline.trim() ? { artworkHeadline: headline } : {}),
          },
        }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        setFailed(true);
        setMessage(copy.errors[result.error ?? ""] ?? copy.error);
      } else setMessage(copy.queued);
    } catch {
      setFailed(true);
      setMessage(copy.error);
    } finally {
      setPending(false);
    }
  }
  return (
    <form className="flex flex-col gap-6 max-w-2xl" onSubmit={handleSubmit}>
      <h1 className="font-semibold text-2xl">{copy.title}</h1>
      <p>{copy.description}</p>
      <div className="flex flex-col gap-2">
        <p>{copy.checkDescription}</p>
        <Button
          aria-busy={checking}
          disabled={pending || checking}
          onClick={handleCheck}
          type="button"
        >
          {checking && <Loader2 aria-hidden className="animate-spin h-4 w-4" />}
          {checking ? copy.checking : copy.check}
        </Button>
        {checkMessage && (
          <p role={checkFailed ? "alert" : "status"}>{checkMessage}</p>
        )}
      </div>
      <FormField
        disabled={pending}
        id="instagram-import-url"
        label={copy.url}
        onChange={(event) => setUrl(event.target.value)}
        required
        type="url"
        value={url}
      />
      <FormSelectField
        disabled={pending}
        id="instagram-import-assignment"
        label={copy.assignment}
        onChange={(event) => setAssignment(event.target.value)}
        value={assignment}
      >
        <option value="unlocked">{copy.unlocked}</option>
        <option value="reviewed">{copy.reviewed}</option>
      </FormSelectField>
      <TextAreaInput
        disabled={pending}
        id="instagram-import-caption"
        label={copy.caption}
        maxLength={2200}
        onChange={(event) => setCaption(event.target.value)}
        value={caption}
      />
      <FormField
        disabled={pending}
        id="instagram-import-headline"
        label={copy.headline}
        maxLength={300}
        onChange={(event) => setHeadline(event.target.value)}
        value={headline}
      />
      <Button aria-busy={pending} disabled={pending || checking} type="submit">
        {pending && <Loader2 aria-hidden className="animate-spin h-4 w-4" />}
        {pending ? copy.pending : copy.submit}
      </Button>
      {message && <p role={failed ? "alert" : "status"}>{message}</p>}
    </form>
  );
}
