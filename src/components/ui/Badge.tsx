import { Lock, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { BADGE_TONES } from "./badgeTones";

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
const T = BADGE_TONES;
const KIND_STYLES = {
  "admin-set": `${CATEGORY} ${T.ground.badge} gap-1 inline-flex items-center`,
  approval: CATEGORY,
  "article-tag": `border font-medium px-2 py-1 rounded-full text-xs ${T.category.badge}`,
  category: `${CATEGORY} ${T.category.badge}`,
  country: `border font-medium gap-1.5 inline-flex items-center px-[9px] py-[3px] rounded-[6px] text-[11px] whitespace-nowrap ${T.ground.badge}`,
  credential:
    "bg-white/10 inline-flex items-center px-3 py-1 rounded-[6px] text-white text-xs",
  "inspiration-level":
    "font-semibold px-4 py-2 rounded-sm shadow-lg text-sm text-white",
  "inspiration-tag":
    "backdrop-blur-sm bg-white/15 px-3 py-1 rounded-sm text-white/80 text-xs",
  "inspiration-type":
    "backdrop-blur-md bg-black/60 border border-white/40 font-semibold px-4 py-2 rounded-sm shadow-lg text-sm text-white",
  invitation: CATEGORY,
  level: `${CATEGORY} inline-flex items-center whitespace-nowrap ${T.category.badge}`,
  preference:
    "border font-medium gap-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs",
  product: `${CATEGORY} inline-flex items-center whitespace-nowrap`,
  verified:
    "bg-emerald-500/90 font-semibold gap-1 inline-flex items-center px-2 py-0.5 rounded-[6px] text-white text-xs",
};
const INVITATION_STYLES: Record<string, string> = {
  alreadyMember: T.ground.badge,
  expired: T.ochre.badge,
  invited: T.sage.badge,
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
      value?.toLowerCase() === "xsed"
        ? "bg-xsed border-xsed text-white"
        : T.category.badge;
  } else if (kind === "invitation") {
    stateStyle = Object.hasOwn(INVITATION_STYLES, value ?? "")
      ? INVITATION_STYLES[value!]
      : T.sage.badge;
  } else if (kind === "approval") {
    stateStyle = value === "approved" ? T.success.badge : T.ochre.badge;
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
