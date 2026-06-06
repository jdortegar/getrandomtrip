import { cn } from "@/lib/utils";

interface PageHeadingProps {
  className?: string;
  description?: string;
  title: string;
}

export function PageHeading({
  className,
  description,
  title,
}: PageHeadingProps) {
  return (
    <div className={cn("mb-8", className)}>
      <h1 className="mb-2 font-barlow-condensed text-4xl sm:text-7xl font-bold leading-none text-neutral-900">
        {title}
      </h1>
      {description ? (
        <p className="text-base sm:text-lg text-neutral-600">{description}</p>
      ) : null}
    </div>
  );
}
