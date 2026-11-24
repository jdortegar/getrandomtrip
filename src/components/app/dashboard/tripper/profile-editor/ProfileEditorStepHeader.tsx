interface ProfileEditorStepHeaderProps {
  badge: string;
  eyebrow: string;
  lead: string;
  title: string;
}

/** Eyebrow + editorial heading that opens each step, with its Essential/Optional badge. */
export function ProfileEditorStepHeader({ badge, eyebrow, lead, title }: ProfileEditorStepHeaderProps) {
  return (
    <header className="flex flex-col gap-3" data-component="ProfileEditorStepHeader">
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
        <span className="rounded-[6px] border border-gray-300 bg-white px-2 py-0.5 text-[11px] font-medium uppercase tracking-wider text-neutral-600">
          {badge}
        </span>
      </div>
      <h2 className="font-barlow-condensed text-3xl font-bold uppercase leading-none text-ink sm:text-4xl">
        {title}
      </h2>
      <p className="max-w-2xl text-base text-neutral-600">{lead}</p>
    </header>
  );
}
