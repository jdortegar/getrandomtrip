import type { DesignSystemLogoLockupDict } from "@/lib/types/dictionary";

type LockupCaptionProps = Pick<
  DesignSystemLogoLockupDict,
  "description" | "name"
>;

export function LockupCaption({ description, name }: LockupCaptionProps) {
  return (
    <figcaption className="bg-white border-gray-200 border-t p-4">
      <span className="block font-semibold text-sm">{name}</span>
      <span className="block mt-1 text-neutral-600 text-xs">{description}</span>
    </figcaption>
  );
}
