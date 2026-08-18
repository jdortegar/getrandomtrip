"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { RoleAccessPanel } from "@/components/app/admin/user-edit/RoleAccessPanel";
import { PriceOverrideGrid } from "@/components/app/admin/user-edit/PriceOverrideGrid";
import {
  gridStateFromOverrides,
  isGridStateDirty,
  overridesPayloadFromGridState,
  type PriceGridState,
} from "@/components/app/admin/user-edit/userEditHelpers";
import { isValidCommissionPercent, toCommissionPercent } from "@/lib/tripper/commission";
import type { TripperPriceOverrides } from "@/lib/pricing/tripper-price-overrides";
import type { AdminUserEditPageDict } from "@/lib/types/dictionary";
import type { PriceLevelId, TravelerTypeSlug } from "@/lib/data/traveler-types";
import type { UserRole } from "@prisma/client";
import styles from "@/components/app/admin/user-edit/userEdit.module.css";

interface EditableUser {
  commission: number | null;
  id: string;
  name: string;
  roles: UserRole[];
  tripperPriceOverrides: TripperPriceOverrides | null;
}

interface AdminUserEditPageClientProps {
  copy: AdminUserEditPageDict;
  locale: string;
  user: EditableUser;
}

function sortRoles(roles: UserRole[]): UserRole[] {
  return [...roles].sort((a, b) => a.localeCompare(b));
}

function rolesEqual(a: UserRole[], b: UserRole[]): boolean {
  return sortRoles(a).join(",") === sortRoles(b).join(",");
}

function withMembershipToggled(
  current: UserRole[],
  member: "ADMIN" | "TRIPPER",
  enabled: boolean,
): UserRole[] {
  const other = current.filter((r) => r !== "TRAVELER" && r !== member);
  return enabled
    ? sortRoles(["TRAVELER", member, ...other])
    : sortRoles(["TRAVELER", ...other]);
}

export function AdminUserEditPageClient({
  copy,
  locale,
  user,
}: AdminUserEditPageClientProps) {
  const router = useRouter();
  const initialRoles = useMemo(() => sortRoles(user.roles), [user.roles]);
  const initialCommissionPct = useMemo(
    () => String(toCommissionPercent(user.commission)),
    [user.commission],
  );
  const initialGrid = useMemo(
    () => gridStateFromOverrides(user.tripperPriceOverrides),
    [user.tripperPriceOverrides],
  );

  const [roles, setRoles] = useState<UserRole[]>(initialRoles);
  const [commissionPct, setCommissionPct] = useState(initialCommissionPct);
  const [gridState, setGridState] = useState<PriceGridState>(initialGrid);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const tripper = roles.includes("TRIPPER");
  const admin = roles.includes("ADMIN");

  const commissionValid =
    !tripper ||
    (commissionPct.trim() !== "" &&
      isValidCommissionPercent(Number(commissionPct)));

  const gridHasInvalidCell = Object.values(gridState).some((levels) =>
    Object.values(levels ?? {}).some((raw) => {
      const trimmed = (raw ?? "").trim();
      if (trimmed === "") return false;
      const n = Number(trimmed);
      return !Number.isFinite(n) || n < 0;
    }),
  );

  const rolesChanged = !rolesEqual(roles, initialRoles);
  const commissionChanged = tripper && commissionPct !== initialCommissionPct;
  const gridChanged = tripper && isGridStateDirty(initialGrid, gridState);
  const dirty = rolesChanged || commissionChanged || gridChanged;
  const canSave = dirty && !saving && commissionValid && !gridHasInvalidCell;

  const currentOverridesPayload = overridesPayloadFromGridState(gridState);

  function goBackToUsers() {
    router.push(`/${locale}/dashboard/admin/settings`);
  }

  function handleCellChange(
    type: TravelerTypeSlug,
    level: PriceLevelId,
    value: string,
  ) {
    setGridState((prev) => ({
      ...prev,
      [type]: { ...prev[type], [level]: value },
    }));
  }

  function handleResetCell(type: TravelerTypeSlug, level: PriceLevelId) {
    handleCellChange(type, level, "");
  }

  function handleResetAll() {
    setGridState({});
  }

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        body: JSON.stringify({
          roles,
          ...(tripper ? { commission: Number(commissionPct) } : {}),
          ...(tripper ? { priceOverrides: currentOverridesPayload } : {}),
        }),
        headers: { "Content-Type": "application/json" },
        method: "PATCH",
      });
      if (res.ok) {
        goBackToUsers();
        return;
      }
      const data = (await res.json()) as { error?: string };
      setError(data.error ?? copy.errorFallback);
    } catch {
      setError(copy.errorFallback);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.root}>
      <div className={styles.stack}>
        <button
          className={styles.backLink}
          onClick={goBackToUsers}
          type="button"
        >
          <ArrowLeft className="h-4 w-4" />
          {copy.backToUsers}
        </button>

        <div className={styles.header}>
          <div className={styles.headerTitleBlock}>
            <p className={styles.eyebrow}>{copy.eyebrow}</p>
            <h1 className={`${styles.pageTitle} ${styles.cond}`}>
              {user.name}
            </h1>
            <p className={styles.pageSubtitle}>{copy.subtitle}</p>
          </div>
          <div className={styles.headerActions}>
            <button
              className={`${styles.btn} ${styles.btnSecondary}`}
              disabled={saving}
              onClick={goBackToUsers}
              type="button"
            >
              {copy.cancel}
            </button>
            <button
              className={`${styles.btn} ${styles.btnPrimary}`}
              disabled={!canSave}
              onClick={() => void handleSave()}
              type="button"
            >
              <Check className="h-4 w-4" />
              {saving ? copy.saving : copy.save}
            </button>
          </div>
        </div>

        {error && (
          <p className="text-sm font-medium text-red-600">{error}</p>
        )}

        <RoleAccessPanel
          admin={admin}
          commissionError={tripper && !commissionValid}
          commissionPct={commissionPct}
          copy={copy.rolesPanel}
          onAdminChange={(checked) =>
            setRoles((prev) => withMembershipToggled(prev, "ADMIN", checked))
          }
          onCommissionChange={setCommissionPct}
          onTripperChange={(checked) =>
            setRoles((prev) => withMembershipToggled(prev, "TRIPPER", checked))
          }
          tripper={tripper}
        />

        {tripper ? (
          <PriceOverrideGrid
            copy={copy.pricingPanel}
            gridState={gridState}
            levelsCopy={copy.levels}
            locale={locale}
            onCellChange={handleCellChange}
            onResetAll={handleResetAll}
            onResetCell={handleResetCell}
          />
        ) : (
          <div className={styles.mutedNote}>
            <p className={styles.mutedNoteTitle}>
              {copy.notTripperNotice.title}
            </p>
            <p className={styles.mutedNoteCaption}>
              {copy.notTripperNotice.caption}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
