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
      <h1 className="mb-6 font-barlow-condensed text-6xl font-bold leading-none text-neutral-900">
        {title}
      </h1>
      {description ? (
        <p className="mt-2 text-sm text-neutral-600">{description}</p>
      ) : null}
    </div>
  );
}
