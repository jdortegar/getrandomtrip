"use client";

import Chip from "@/components/Chip";
import type { AdminUserEditPageDict } from "@/lib/types/dictionary";
import styles from "./userEdit.module.css";

interface RoleAccessPanelProps {
  admin: boolean;
  commissionError: boolean;
  commissionPct: string;
  copy: AdminUserEditPageDict["rolesPanel"];
  onAdminChange: (checked: boolean) => void;
  onCommissionChange: (value: string) => void;
  onTripperChange: (checked: boolean) => void;
  tripper: boolean;
}

export function RoleAccessPanel({
  admin,
  commissionError,
  commissionPct,
  copy,
  onAdminChange,
  onCommissionChange,
  onTripperChange,
  tripper,
}: RoleAccessPanelProps) {
  return (
    <div className={styles.panel}>
      <div className={styles.panelBody}>
        <div className={styles.sectionHeadingRow}>
          <div>
            <span className={styles.sectionNumber}>{copy.number}</span>
            <p className={styles.panelTitle}>{copy.title}</p>
            <p className={styles.panelDesc}>{copy.desc}</p>
          </div>
        </div>
        <div className={styles.grid2}>
          <div className={styles.fieldGroup}>
            <div>
              <span className={styles.label}>{copy.travelerBaseHint}</span>
              <div className={styles.chipRow}>
                <Chip active disabled>
                  {copy.travelerBase}
                </Chip>
                <Chip active={tripper} onClick={() => onTripperChange(!tripper)}>
                  {copy.tripper}
                </Chip>
                <Chip active={admin} onClick={() => onAdminChange(!admin)}>
                  {copy.admin}
                </Chip>
              </div>
            </div>
          </div>
          {tripper && (
            <div className={styles.fieldGroup}>
              <div>
                <span className={styles.label}>{copy.commissionLabel}</span>
                <div className={styles.inputWrap}>
                  <input
                    className={styles.numberInput}
                    inputMode="numeric"
                    max={100}
                    min={0}
                    onChange={(e) => onCommissionChange(e.target.value)}
                    placeholder={copy.commissionPlaceholder}
                    type="number"
                    value={commissionPct}
                  />
                  <span className={styles.inputSuffix}>%</span>
                </div>
                {commissionError && (
                  <p className="mt-2 text-sm font-medium text-red-600">
                    {copy.commissionError}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
