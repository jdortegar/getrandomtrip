import { cn } from "@/lib/utils";

interface PageHeadingProps {
  className?: string;
  description?: string;
  eyebrow?: string;
  title: string;
}

export function PageHeading({
  className,
  description,
  eyebrow,
  title,
}: PageHeadingProps) {
  return (
    <div className={cn("mb-8", className)} data-component="PageHeading">
      {eyebrow ? (
        <p
          className={cn(
            "mb-4 text-base text-neutral-600 uppercase",
            "sm:text-lg",
          )}
        >
          {eyebrow}
        </p>
      ) : null}
      <h1 className="mb-2 font-barlow-condensed text-4xl sm:text-7xl font-bold leading-none text-ink">
        {title}
      </h1>
      {description ? (
        <p className="text-base sm:text-lg text-neutral-600">{description}</p>
      ) : null}
    </div>
  );
}
