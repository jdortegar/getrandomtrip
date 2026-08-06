"use client";

import { useEffect, useState } from "react";
import { UserCog } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Modal,
} from "@/components/ui/Modal";
import type { MarketingDictionary } from "@/lib/types/dictionary";
import {
  isValidCommissionPercent,
  toCommissionPercent,
} from "@/lib/tripper/commission";
import type { AdminUser, UserRole } from "./UsersTableRow";
import { isModalDirty, shouldIncludeCommission } from "./userRoleModalHelpers";

function sortRoles(roles: UserRole[]): UserRole[] {
  return [...roles].sort((a, b) => a.localeCompare(b));
}

function rolesEqual(a: UserRole[], b: UserRole[]): boolean {
  const aa = sortRoles(a).join(",");
  const bb = sortRoles(b).join(",");
  return aa === bb;
}

function withMembershipToggled(
  current: UserRole[],
  member: "ADMIN" | "TRIPPER",
  enabled: boolean,
): UserRole[] {
  const other = current.filter((r) => r !== "TRAVELER" && r !== member);
  if (enabled) {
    return sortRoles(["TRAVELER", member, ...other]);
  }
  return sortRoles(["TRAVELER", ...other]);
}

interface UserRoleModalProps {
  copy: MarketingDictionary["adminUsers"];
  onClose: () => void;
  onSaved: () => void;
  open: boolean;
  user: AdminUser;
}

export function UserRoleModal({
  copy,
  onClose,
  onSaved,
  open,
  user,
}: UserRoleModalProps) {
  const [roles, setRoles] = useState<UserRole[]>(user.roles);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [commissionPct, setCommissionPct] = useState(() =>
    String(toCommissionPercent(user.commission)),
  );
  const [commissionTouched, setCommissionTouched] = useState(false);

  // Depend on role *contents* (order-independent), not array reference — a new
  // `roles[]` reference each parent render would retrigger this and loop with setRoles.
  const userRolesKey = sortRoles([...user.roles]).join(",");

  useEffect(() => {
    setRoles(sortRoles([...user.roles]));
    setError("");
    setCommissionPct(String(toCommissionPercent(user.commission)));
    setCommissionTouched(false);
  }, [user.id, userRolesKey, user.commission]);

  const isTripper = roles.includes("TRIPPER");
  const parsedCommissionPct = Number(commissionPct);
  const commissionValid =
    !commissionTouched ||
    (commissionPct.trim() !== "" &&
      isValidCommissionPercent(parsedCommissionPct));
  const rolesChanged = !rolesEqual(roles, user.roles);
  const dirty = isModalDirty(
    rolesChanged,
    isTripper,
    commissionTouched,
    commissionValid,
  );
  const includeCommission = shouldIncludeCommission(
    isTripper,
    commissionTouched,
  );

  async function handleSave() {
    if (!dirty) {
      onClose();
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        body: JSON.stringify({
          roles: sortRoles(roles),
          ...(includeCommission ? { commission: parsedCommissionPct } : {}),
        }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      if (res.ok) {
        onSaved();
        onClose();
      } else {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? copy.modal.errorFallback);
      }
    } catch {
      setError(copy.modal.errorFallback);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      className="flex max-w-md flex-col gap-0 overflow-hidden border-gray-200 p-0 sm:max-w-md"
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
      open={open}
      showCloseButton
    >
      <DialogHeader className="shrink-0 border-b border-gray-200 px-6 py-4 text-left">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-light-blue/10">
            <UserCog className="h-4 w-4 text-light-blue" />
          </div>
          <div>
            <DialogTitle className="text-xl font-semibold text-gray-900">
              {user.name}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              {user.email}
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <div className="px-6 py-5">
        <div className="space-y-3">
          <p className="text-sm font-medium text-neutral-900">
            {copy.modal.roleSection}
          </p>
          <label className="flex items-center gap-2 rounded-md bg-neutral-50 px-2 py-1.5 text-sm text-neutral-700">
            <input
              checked
              className="h-4 w-4 accent-light-blue"
              disabled
              type="checkbox"
            />
            <span>{copy.modal.travelerBase}</span>
          </label>
          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input
              checked={roles.includes("TRIPPER")}
              className="h-4 w-4 accent-light-blue focus-visible:ring-2 focus-visible:ring-light-blue focus-visible:ring-offset-1"
              onChange={() => {
                setRoles((prev) =>
                  withMembershipToggled(
                    prev,
                    "TRIPPER",
                    !prev.includes("TRIPPER"),
                  ),
                );
              }}
              type="checkbox"
            />
            <span>{copy.modal.tripper}</span>
          </label>
          {isTripper && (
            <div className="pl-6">
              <label
                className="mb-1 block text-xs font-medium text-neutral-500"
                htmlFor="admin-user-commission-pct"
              >
                {copy.modal.commissionLabel}
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  className="h-10 w-24 rounded-lg border border-gray-200 px-3 text-sm shadow-sm focus:border-gray-300 focus:outline-none"
                  id="admin-user-commission-pct"
                  inputMode="numeric"
                  max={100}
                  min={0}
                  onChange={(e) => {
                    setCommissionPct(e.target.value);
                    setCommissionTouched(true);
                  }}
                  placeholder={copy.modal.commissionPlaceholder}
                  step={1}
                  type="number"
                  value={commissionPct}
                />
                <span className="text-sm text-neutral-500">%</span>
              </div>
            </div>
          )}
          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input
              checked={roles.includes("ADMIN")}
              className="h-4 w-4 accent-light-blue focus-visible:ring-2 focus-visible:ring-light-blue focus-visible:ring-offset-1"
              onChange={() => {
                setRoles((prev) =>
                  withMembershipToggled(prev, "ADMIN", !prev.includes("ADMIN")),
                );
              }}
              type="checkbox"
            />
            <span>{copy.modal.admin}</span>
          </label>
        </div>
        {!commissionValid && (
          <p className="mt-2 text-sm font-medium text-red-600">
            {copy.modal.commissionError}
          </p>
        )}
        {error && (
          <p className="mt-2 text-sm font-medium text-red-600">{error}</p>
        )}
      </div>

      <DialogFooter className="shrink-0 border-t border-gray-200 px-6 py-4 sm:justify-end">
        <Button
          disabled={saving}
          onClick={onClose}
          size="sm"
          type="button"
          variant="secondary"
        >
          {copy.modal.cancel}
        </Button>
        <Button
          disabled={saving || !dirty}
          onClick={() => void handleSave()}
          size="sm"
          type="button"
          variant="default"
        >
          {saving ? copy.modal.saving : copy.modal.saveChanges}
        </Button>
      </DialogFooter>
    </Modal>
  );
}
