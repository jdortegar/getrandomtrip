"use client";

import {
  getTypeLabel,
  type PriceLevelId,
  type TravelerTypeSlug,
} from "@/lib/data/traveler-types";
import { isPairOffered } from "@/lib/pricing/tripper-price-overrides";
import type { AdminUserEditPageDict } from "@/lib/types/dictionary";
import type { PriceGridState } from "./userEditHelpers";
import styles from "./userEdit.module.css";

/** Column order matches the approved prototype exactly (Main.dc.html). */
const DISPLAY_TYPE_ORDER: TravelerTypeSlug[] = [
  "couple",
  "solo",
  "family",
  "group",
  "honeymoon",
  "paws",
];

const DISPLAY_LEVEL_ORDER: PriceLevelId[] = [
  "essenza",
  "explora",
  "explora-plus",
  "bivouac",
  "atelier",
];

interface PriceOverrideGridProps {
  copy: AdminUserEditPageDict["pricingPanel"];
  gridState: PriceGridState;
  levelsCopy: AdminUserEditPageDict["levels"];
  locale: string;
  onCellChange: (
    type: TravelerTypeSlug,
    level: PriceLevelId,
    value: string,
  ) => void;
  onResetAll: () => void;
  onResetCell: (type: TravelerTypeSlug, level: PriceLevelId) => void;
}

export function PriceOverrideGrid({
  copy,
  gridState,
  levelsCopy,
  locale,
  onCellChange,
  onResetAll,
  onResetCell,
}: PriceOverrideGridProps) {
  return (
    <div className={styles.panel}>
      <div className={styles.panelBody}>
        <div className={styles.sectionHeadingRow}>
          <div>
            <span className={styles.sectionNumber}>{copy.number}</span>
            <p className={styles.panelTitle}>{copy.title}</p>
            <p className={styles.panelDesc}>{copy.desc}</p>
            <p className={styles.panelDesc}>{copy.adminOnlyNote}</p>
          </div>
          <button
            className={styles.resetCellBtn}
            onClick={onResetAll}
            type="button"
          >
            {copy.resetAll}
          </button>
        </div>

        <div className={styles.priceTableWrap}>
          <table className={styles.priceTable}>
            <thead>
              <tr>
                <th>{copy.levelHeader}</th>
                {DISPLAY_TYPE_ORDER.map((type) => (
                  <th key={type}>{getTypeLabel(type, locale)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DISPLAY_LEVEL_ORDER.map((level) => (
                <tr key={level}>
                  <td>
                    <span className={styles.levelCell}>
                      <span className={styles.levelChip}>
                        {levelsCopy[level]}
                      </span>
                    </span>
                  </td>
                  {DISPLAY_TYPE_ORDER.map((type) => {
                    if (!isPairOffered(type, level)) {
                      return (
                        <td key={type}>
                          <div className={styles.notOffered}>
                            {copy.notOffered}
                          </div>
                        </td>
                      );
                    }
                    const raw = gridState[type]?.[level] ?? "";
                    const isOverridden = raw.trim() !== "";
                    return (
                      <td key={type}>
                        <div className={styles.priceCellWrap}>
                          <span className={styles.priceCellPrefix}>$</span>
                          <input
                            className={styles.priceCellInput}
                            inputMode="numeric"
                            min={0}
                            onChange={(e) =>
                              onCellChange(type, level, e.target.value)
                            }
                            placeholder={copy.inheritPlaceholder}
                            type="number"
                            value={raw}
                          />
                        </div>
                        {isOverridden && (
                          <div>
                            <button
                              className={styles.resetCellBtn}
                              onClick={() => onResetCell(type, level)}
                              type="button"
                            >
                              {copy.resetCell}
                            </button>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
