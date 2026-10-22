import { cn } from "@/lib/utils";

interface BrandIndexLabelProps {
  as?: "h4" | "p";
  children: string;
  className?: string;
}

function splitIndexLabel(label: string) {
  const separator = label.indexOf("|");
  if (separator === -1) return { index: "", name: label };
  return {
    index: label.slice(0, separator).trim(),
    name: label.slice(separator + 1).trim(),
  };
}

export function BrandIndexLabel({
  as: Tag = "p",
  children,
  className,
}: BrandIndexLabelProps) {
  const { index, name } = splitIndexLabel(children);
  return (
    <Tag
      className={cn(
        "font-barlow-condensed font-bold text-lg uppercase",
        index && "inline-flex gap-1.5 items-baseline",
        className,
      )}
      data-brand-index
    >
      {index ? (
        <span className="text-feature" data-brand-index-mark>
          {index} |
        </span>
      ) : null}
      <span className="text-primary">{name}</span>
    </Tag>
  );
}
