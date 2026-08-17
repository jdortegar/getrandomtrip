"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { Dictionary } from "@/lib/i18n/dictionaries";

type BlockReason = "ACTIVE_TRIPS" | "OWNED_EXPERIENCES" | "ADMIN_ROLE";

interface AccountDangerZoneProps {
  copy: Dictionary["profile"]["dangerZone"];
}

function blockedMessage(
  copy: AccountDangerZoneProps["copy"],
  reasons: string[],
): string {
  const messages = reasons
    .map((reason) => {
      switch (reason as BlockReason) {
        case "ACTIVE_TRIPS":
          return copy.blockedActiveTrips;
        case "OWNED_EXPERIENCES":
          return copy.blockedOwnedExperiences;
        case "ADMIN_ROLE":
          return copy.blockedAdmin;
        default:
          return null;
      }
    })
    .filter((message): message is string => Boolean(message));
  return messages.join(" ");
}

export function AccountDangerZone({ copy }: AccountDangerZoneProps) {
  const [confirming, setConfirming] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [error, setError] = useState("");

  async function handleDeactivate() {
    setDeactivating(true);
    setError("");
    try {
      const response = await fetch("/api/user/deactivate", { method: "POST" });
      const body = (await response.json().catch(() => ({}))) as {
        reasons?: string[];
      };

      if (response.ok) {
        await signOut({ callbackUrl: "/" });
        return;
      }

      setError(
        response.status === 409 && body.reasons
          ? `${copy.blockedTitle} ${blockedMessage(copy, body.reasons)}`
          : copy.error,
      );
    } catch {
      setError(copy.error);
    } finally {
      setDeactivating(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-5 rounded-xl border border-red-200 bg-red-50 p-5">
        <div className="flex max-w-[60ch] items-start gap-3">
          <AlertTriangle className="mt-0.5 h-[18px] w-[18px] shrink-0 text-red-600" />
          <div>
            <p className="m-0 text-sm font-bold text-red-800">
              {copy.confirmTitle}
            </p>
            {error && <p className="m-0 mt-1 text-xs text-red-900/85">{error}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            disabled={deactivating}
            onClick={() => {
              setConfirming(false);
              setError("");
            }}
            variant="secondary"
          >
            {copy.cancel}
          </Button>
          <Button
            disabled={deactivating}
            onClick={() => void handleDeactivate()}
            variant="destructive"
          >
            {deactivating ? copy.confirming : copy.deleteButton}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-5 rounded-xl border border-red-200 bg-red-50 p-5">
      <div className="flex max-w-[60ch] items-start gap-3">
        <AlertTriangle className="mt-0.5 h-[18px] w-[18px] shrink-0 text-red-600" />
        <div>
          <p className="m-0 text-sm font-bold text-red-800">{copy.title}</p>
          <p className="m-0 mt-0.5 text-xs text-red-900/85">{copy.hint}</p>
        </div>
      </div>
      <Button onClick={() => setConfirming(true)} variant="destructive">
        {copy.deleteButton}
      </Button>
    </div>
  );
}
