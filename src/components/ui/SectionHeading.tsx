import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  align?: "center" | "left";
  eyebrow?: string;
  subtitle?: string;
  title: string;
}

export default function SectionHeading({
  align = "center",
  eyebrow,
  subtitle,
  title,
}: SectionHeadingProps) {
  return (
    <header
      className={cn(
        "max-w-prose",
        align === "center" ? "mx-auto text-center" : "text-left",
      )}
      data-component="SectionHeading"
    >
      {eyebrow ? (
        <p className="font-semibold mb-2 text-primary text-xs tracking-[0.18em] uppercase">
          {eyebrow}
        </p>
      ) : null}
      <h2
        className={cn(
          "font-barlow-condensed font-bold text-3xl text-ink uppercase",
          "sm:text-4xl md:text-[44px]",
          "leading-none",
        )}
      >
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-3 text-neutral-600">{subtitle}</p>
      ) : null}
    </header>
  );
}
