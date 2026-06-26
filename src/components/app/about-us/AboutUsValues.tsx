import Img from "@/components/common/Img";
import Section from "@/components/layout/Section";

// ─── Icons ────────────────────────────────────────────────────────────────────

const ICONS = [
  { src: "/assets/svg/handcraft.svg", width: 85, height: 81 },
  { src: "/assets/svg/security.svg", width: 63, height: 70 },
  { src: "/assets/svg/community.svg", width: 72, height: 57 },
] as const;

// ─── Props ────────────────────────────────────────────────────────────────────

interface ValuePropsItem {
  title: string;
  copy: string;
}

interface AboutUsValuesProps {
  items: ValuePropsItem[];
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AboutUsValues({ items }: AboutUsValuesProps) {
  return (
    <Section>
      <div className="rt-container">
        <div className="grid grid-cols-1 gap-2 md:gap-12 md:grid-cols-3">
          {items.map((item, i) => {
            const icon = ICONS[i];
            return (
              <article key={item.title} className="flex flex-col gap-4 p-10">
                <div className="flex items-end gap-2">
                  <h3 className="w-auto text-left font-barlow-condensed font-bold text-2xl uppercase leading-tight text-primary">
                    {item.title}
                  </h3>
                  {icon && (
                    <Img
                      alt=""
                      aria-hidden="true"
                      className="h-14 w-auto shrink-0"
                      height={icon.height}
                      src={icon.src}
                      width={icon.width}
                    />
                  )}
                </div>

                <p className="text-left font-barlow text-lg text-[#888] leading-relaxed">
                  {item.copy}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </Section>
  );
}
