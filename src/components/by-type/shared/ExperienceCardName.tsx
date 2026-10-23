interface ExperienceCardNameProps {
  name: string;
}

/** Stacks space-separated words (Figma: "MODO" / "EXPLORA") and superscripts a trailing ™. */
export function ExperienceCardName({ name }: ExperienceCardNameProps) {
  const match = /^(.*?)\s*™$/.exec(name);
  const base = match?.[1] ?? name;
  const lines = base.split(/\s+/).filter(Boolean);
  const mark = match ? (
    <sup className="align-text-top font-semibold leading-none mt-3 text-[0.4em]">
      ™
    </sup>
  ) : null;

  return (
    <h3
      className="font-barlow-condensed text-[48px] font-extrabold uppercase leading-[45px] text-primary"
      data-name-lines={lines.length}
    >
      {lines.map((line, index) => {
        const isLast = index === lines.length - 1;
        return (
          <span
            className={
              isLast && mark
                ? "inline-flex items-start whitespace-pre"
                : "block whitespace-pre"
            }
            key={line}
          >
            {isLast ? line : `${line} `}
            {isLast ? mark : null}
          </span>
        );
      })}
    </h3>
  );
}
