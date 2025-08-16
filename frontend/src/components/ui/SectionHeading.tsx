export default function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
}) {
  const alignCls = align === "center" ? "text-center mx-auto" : "text-left";
  return (
    <header className={`${alignCls} max-w-prose`}>
      {eyebrow && (
        <div className="mb-2 text-xs uppercase tracking-[0.18em] text-neutral-500">
          {eyebrow}
        </div>
      )}
      <h2 className="font-display text-3xl sm:text-4xl md:text-[44px] leading-[1.1] tracking-tightish">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-3 text-neutral-600">{subtitle}</p>
      )}
    </header>
  );
}