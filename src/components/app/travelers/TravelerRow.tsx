"use client";

import { useState } from "react";
import { Check, Lock, Send } from "lucide-react";
import { FormField } from "@/components/ui/FormField";
import { TableIconButton } from "@/components/ui/TableIconButton";
import { TravelerStatusBadge } from "@/components/common/TravelerStatusBadge";
import {
  isAdultIdDocumentEditable,
  isMinorRowFilled,
} from "@/lib/travelers/travelerRowValidation";
import type { InviteTravelersDict } from "@/lib/types/dictionary";
import type { TravelerDTO } from "@/types/traveler";

interface TravelerRowProps {
  copy: InviteTravelersDict;
  locked: boolean;
  onUpdated: (traveler: TravelerDTO) => void;
  traveler: TravelerDTO;
  travelerNumber: number;
}

const STATUS_LABEL: Record<TravelerDTO["status"], keyof InviteTravelersDict> = {
  PENDING: "statusPending",
  INVITED: "statusInvited",
  COMPLETE: "statusComplete",
};

function toDateInputValue(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

export function TravelerRow({
  copy,
  locked,
  onUpdated,
  traveler,
  travelerNumber,
}: TravelerRowProps) {
  const [fullName, setFullName] = useState(traveler.fullName ?? "");
  const [email, setEmail] = useState(traveler.email ?? "");
  const [idDocument, setIdDocument] = useState(traveler.idDocument ?? "");
  const [dateOfBirth, setDateOfBirth] = useState(
    toDateInputValue(traveler.dateOfBirth),
  );
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isAdult = traveler.kind === "ADULT";
  const idEditable = isAdult ? isAdultIdDocumentEditable(traveler.status) : true;

  async function patchRow(body: Record<string, string>) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/travelers/${traveler.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          data?.error === "incomplete"
            ? copy.incompleteError
            : copy.saveErrorGeneric,
        );
        return;
      }
      setNote(copy.savedNote);
      onUpdated(data.traveler as TravelerDTO);
    } catch {
      setError(copy.saveErrorGeneric);
    } finally {
      setSaving(false);
    }
  }

  function handleAdultBlur() {
    if (locked || saving) return;
    void patchRow({ fullName, email, idDocument });
  }

  function handleMinorSave() {
    if (locked || saving) return;
    if (!isMinorRowFilled({ fullName, dateOfBirth, idDocument })) {
      setError(copy.incompleteError);
      return;
    }
    void patchRow({ fullName, dateOfBirth, idDocument });
  }

  async function handleSendInvite() {
    if (locked || saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/travelers/${traveler.id}/invite`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(copy.sendInviteErrorGeneric);
        return;
      }
      setNote(
        traveler.status === "INVITED" ? copy.inviteResentNote : copy.invitedNote,
      );
      onUpdated(data.traveler as TravelerDTO);
    } catch {
      setError(copy.sendInviteErrorGeneric);
    } finally {
      setSaving(false);
    }
  }

  const rowFoot = error
    ? error
    : note
      ? note
      : !isAdult
        ? copy.minorFilledByBuyerNote
        : traveler.status === "INVITED" && traveler.invitedAt
          ? copy.invitedNote.replace(
              "{date}",
              new Date(traveler.invitedAt).toLocaleDateString(),
            )
          : null;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <span
            className={`rounded-[6px] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.06em] ${
              isAdult
                ? "bg-gray-100 text-gray-700"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            {isAdult ? copy.adultTag : copy.minorTag}
          </span>
          {copy.travelerLabel.replace("{number}", String(travelerNumber))}
        </div>
        <TravelerStatusBadge
          label={copy[STATUS_LABEL[traveler.status]]}
          status={traveler.status}
        />
      </div>

      <div
        className={`grid grid-cols-1 gap-2.5 sm:items-end ${
          isAdult ? "sm:grid-cols-[1.2fr_1.2fr_1fr_auto]" : "sm:grid-cols-[1.4fr_1fr_1fr_auto]"
        }`}
      >
        <FormField
          disabled={locked}
          id={`traveler-${traveler.id}-fullName`}
          label={copy.fullNameLabel}
          onBlur={isAdult ? handleAdultBlur : undefined}
          onChange={(e) => setFullName(e.target.value)}
          placeholder={copy.fullNamePlaceholder}
          type="text"
          value={fullName}
        />

        {isAdult ? (
          <FormField
            disabled={locked}
            id={`traveler-${traveler.id}-email`}
            label={copy.emailLabel}
            onBlur={handleAdultBlur}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={copy.emailPlaceholder}
            type="email"
            value={email}
          />
        ) : (
          <FormField
            disabled={locked}
            id={`traveler-${traveler.id}-dob`}
            label={copy.dateOfBirthLabel}
            onChange={(e) => setDateOfBirth(e.target.value)}
            type="date"
            value={dateOfBirth}
          />
        )}

        <FormField
          disabled={locked || !idEditable}
          id={`traveler-${traveler.id}-idDocument`}
          label={copy.idDocumentLabel}
          onBlur={isAdult ? handleAdultBlur : undefined}
          onChange={(e) => setIdDocument(e.target.value)}
          placeholder={
            isAdult && !idEditable
              ? copy.idDocumentPendingPlaceholder
              : copy.idDocumentPlaceholder
          }
          type="text"
          value={idDocument}
        />

        {isAdult ? (
          <TableIconButton
            danger={false}
            disabled={locked || !email || saving}
            onClick={() => void handleSendInvite()}
            title={
              locked
                ? copy.lockedActionTitle
                : traveler.status === "INVITED"
                  ? copy.resendInviteAction
                  : copy.sendInviteAction
            }
          >
            {locked ? <Lock className="h-4 w-4" /> : <Send className="h-4 w-4" />}
          </TableIconButton>
        ) : (
          <TableIconButton
            disabled={locked || saving}
            onClick={handleMinorSave}
            title={locked ? copy.lockedActionTitle : copy.saveAction}
          >
            {locked ? <Lock className="h-4 w-4" /> : <Check className="h-4 w-4" />}
          </TableIconButton>
        )}
      </div>

      {rowFoot && (
        <p
          className={`mt-2.5 text-xs ${error ? "text-red-600" : "text-neutral-500"}`}
        >
          {rowFoot}
        </p>
      )}
    </div>
  );
}
