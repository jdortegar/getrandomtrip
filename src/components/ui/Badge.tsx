import { Lock, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import styles from "./Badge.module.css";

interface BadgeProps {
  kind?:
    | "category"
    | "product"
    | "invitation"
    | "approval"
    | "admin-set"
    | "country"
    | "level"
    | "preference"
    | "article-tag"
    | "credential"
    | "verified"
    | "inspiration-type"
    | "inspiration-level"
    | "inspiration-tag";
  label: string;
  value?: string;
}

const CATEGORY = "border font-medium px-2 py-0.5 rounded-[6px] text-[11px]";
const SKY = "bg-sky-50 border-sky-200 text-sky-700";
const KIND_STYLES = {
  "admin-set": `${CATEGORY} bg-gray-50 border-gray-200 gap-1 inline-flex items-center text-ink`,
  approval: CATEGORY,
  "article-tag":
    "bg-blue-100 font-medium px-2 py-1 rounded-full text-blue-800 text-xs",
  category: `${CATEGORY} ${SKY}`,
  country:
    "border font-medium gap-1.5 inline-flex items-center px-[9px] py-[3px] rounded-[6px] text-[11px] whitespace-nowrap",
  credential:
    "bg-white/10 inline-flex items-center px-3 py-1 rounded-[6px] text-white text-xs",
  "inspiration-level":
    "font-semibold px-4 py-2 rounded-sm shadow-lg text-sm text-white",
  "inspiration-tag":
    "backdrop-blur-sm bg-white/15 px-3 py-1 rounded-sm text-white/80 text-xs",
  "inspiration-type":
    "backdrop-blur-md bg-black/60 border border-white/40 font-semibold px-4 py-2 rounded-sm shadow-lg text-sm text-white",
  invitation: CATEGORY,
  level:
    "border font-semibold inline-flex items-center px-2.5 py-1 rounded-[6px] text-[12px] whitespace-nowrap",
  preference:
    "border font-medium gap-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs",
  product: `${CATEGORY} inline-flex items-center whitespace-nowrap`,
  verified:
    "bg-emerald-500/90 font-semibold gap-1 inline-flex items-center px-2 py-0.5 rounded-[6px] text-white text-xs",
};
const INVITATION_STYLES: Record<string, string> = {
  alreadyMember: "bg-neutral-50 border-neutral-200 text-neutral-600",
  expired: "bg-amber-50 border-amber-200 text-amber-700",
  invited: SKY,
};
const LEVEL_STYLES: Record<string, string> = {
  atelier: "bg-rose-500",
  bivouac: "bg-green-500",
  essenza: "bg-amber-500",
  "explora-plus": "bg-purple-500",
  "modo-explora": "bg-blue-500",
};

/** Read-only classifications. Callers supply content, never presentation classes. */
export function Badge({ kind = "category", label, value }: BadgeProps) {
  let stateStyle = "";
  if (kind === "product") {
    stateStyle =
      value?.toLowerCase() === "xsed" ? "bg-xsed border-xsed text-white" : SKY;
  } else if (kind === "invitation") {
    stateStyle = Object.hasOwn(INVITATION_STYLES, value ?? "")
      ? INVITATION_STYLES[value!]
      : SKY;
  } else if (kind === "approval") {
    stateStyle =
      value === "approved"
        ? "bg-green-50 border-green-200 text-green-700"
        : "bg-amber-50 border-amber-200 text-amber-700";
  } else if (kind === "inspiration-level") {
    stateStyle = Object.hasOwn(LEVEL_STYLES, value ?? "")
      ? LEVEL_STYLES[value!]
      : "bg-gray-500";
  }
  return (
    <span
      className={cn(
        "uppercase",
        KIND_STYLES[kind],
        stateStyle,
        kind === "country" && styles.country,
        kind === "level" && styles.level,
        kind === "credential" && "md:text-sm",
      )}
      data-component="Badge"
    >
      {kind === "admin-set" && <Lock aria-hidden className="h-3 w-3" />}
      {kind === "verified" && <ShieldCheck aria-hidden size={14} />}
      {label}
    </span>
  );
}
