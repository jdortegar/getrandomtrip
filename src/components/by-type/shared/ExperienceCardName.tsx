interface ExperienceCardNameProps {
  name: string;
}

/** Stacks space-separated words (Figma: "MODO" / "EXPLORA") and superscripts a trailing ™. */
export function ExperienceCardName({ name }: ExperienceCardNameProps) {
  const match = /^(.*?)\s*™$/.exec(name);
  const base = match?.[1] ?? name;
  const lines = base.split(/\s+/).filter(Boolean);
  const mark = match ? (
    <sup className="ml-px align-super text-[7px] font-semibold leading-none">
      ™
    </sup>
  ) : null;

  return (
    <h3
      className="min-w-0 font-barlow-condensed text-[50px] font-extrabold uppercase leading-[45px] text-primary"
      data-name-lines={lines.length}
    >
      {lines.map((line, index) => (
        <span className="block whitespace-pre" key={line}>
          {index < lines.length - 1 ? `${line} ` : line}
          {index === lines.length - 1 ? mark : null}
        </span>
      ))}
    </h3>
  );
}
