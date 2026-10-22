import type { ReactNode } from "react";
import type { DesignSystemEssenceDict } from "@/lib/types/dictionary";
import { cn } from "@/lib/utils";

interface BrandEssenceProps {
  copy: DesignSystemEssenceDict;
}

const eyebrow = "font-semibold text-primary text-xs tracking-widest uppercase";

export function BrandEssence({ copy }: BrandEssenceProps) {
  const rows: { id: string; label: string; content: ReactNode }[] = [
    {
      id: "essence",
      label: copy.essence.label,
      content: (
        <p className="font-barlow-condensed font-bold leading-none text-4xl text-primary uppercase">
          {copy.essence.value}
        </p>
      ),
    },
    {
      id: "values",
      label: copy.values.label,
      content: (
        <dl className={cn("gap-4 grid", "sm:grid-cols-3")}>
          {copy.values.items.map((item) => (
            <div key={item.name}>
              <dt className="font-barlow-condensed font-bold text-primary text-xl uppercase">
                {item.name}
              </dt>
              <dd className="mt-1 text-neutral-700 text-sm">
                {item.description}
              </dd>
            </div>
          ))}
        </dl>
      ),
    },
    {
      id: "character",
      label: copy.character.label,
      content: (
        <ul className="flex flex-wrap gap-2">
          {copy.character.items.map((item) => (
            <li
              className="bg-secondary font-semibold px-3 py-1 rounded-full text-ink text-sm"
              key={item}
            >
              {item}
            </li>
          ))}
        </ul>
      ),
    },
    ...(
      [
        ["promise", copy.promise],
        ["valueProposition", copy.valueProposition],
        ["insight", copy.insight],
        ["consumer", copy.consumer],
      ] as const
    ).map(([id, item], index) => ({
      id,
      label: item.label,
      content: (
        <p
          className={cn(
            index === 0
              ? "font-barlow-condensed font-bold text-2xl text-ink uppercase"
              : "text-neutral-700",
          )}
        >
          {item.value}
        </p>
      ),
    })),
  ];

  return (
    <>
      <div className={cn("gap-6 grid", "lg:grid-cols-3")}>
        <div className="bg-white border border-gray-200 p-6 rounded-xl">
          <p className={eyebrow}>{copy.context.label}</p>
          <p className="font-barlow-condensed font-bold leading-tight mt-3 text-2xl uppercase">
            {copy.context.title}
          </p>
          <p className="mt-3 text-neutral-700 text-sm">{copy.context.body}</p>
          <p className="font-nothing-you-could-do mt-4 text-lg text-primary">
            {copy.context.question}
          </p>
        </div>
        <div className="bg-white border border-gray-200 p-6 rounded-xl">
          <p className={eyebrow}>{copy.purpose.label}</p>
          <p className="mt-1 text-neutral-500 text-xs">{copy.purpose.hint}</p>
          <p className="font-barlow-condensed font-bold leading-tight mt-3 text-2xl uppercase">
            {copy.purpose.title}
          </p>
          <p className="mt-3 text-neutral-700 text-sm">{copy.purpose.body}</p>
          <p className={cn(eyebrow, "mt-6")}>{copy.vision.label}</p>
          <p className="mt-1 text-neutral-500 text-xs">{copy.vision.hint}</p>
          <p className="mt-3 text-neutral-700 text-sm">{copy.vision.body}</p>
        </div>
        <div className="bg-white border border-gray-200 p-6 rounded-xl">
          <p className={eyebrow}>{copy.belief.label}</p>
          <p className="font-barlow-condensed font-bold leading-tight mt-3 text-2xl uppercase">
            {copy.belief.title}
          </p>
          <div className="mt-3 space-y-2 text-neutral-700 text-sm">
            {copy.belief.body.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </div>
      </div>
      <h3 className="font-semibold mb-4 mt-10 text-xl">
        {copy.positioningTitle}
      </h3>
      <div className="bg-white border border-gray-200 divide-gray-200 divide-y overflow-hidden rounded-xl">
        {rows.map((row) => (
          <div
            className={cn(
              "gap-3 grid p-6",
              "md:gap-6 md:grid-cols-[12rem_1fr] md:items-baseline",
            )}
            data-essence-row={row.id}
            key={row.id}
          >
            <p className="font-mono text-neutral-600 text-xs uppercase">
              {row.label}
            </p>
            {row.content}
          </div>
        ))}
      </div>
      <div
        className={cn(
          "bg-secondary mt-6 px-6 py-10 rounded-xl text-center",
          "md:py-14",
        )}
      >
        <p className="font-semibold text-ink text-xs tracking-widest uppercase">
          {copy.northStar.label}
        </p>
        <p
          className={cn(
            "font-nothing-you-could-do leading-snug mt-4 text-3xl text-ink",
            "md:text-4xl",
          )}
        >
          {copy.northStar.value}
        </p>
      </div>
    </>
  );
}
