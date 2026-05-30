import Section from "@/components/layout/Section";

interface TrustItem {
  label: string;
  prefix?: string;
  value: string;
}

interface AboutUsTrustContent {
  footnote: string;
  items: TrustItem[];
  sectionTitle: string;
}

interface AboutUsTrustProps {
  content: AboutUsTrustContent;
}

export function AboutUsTrust({ content }: AboutUsTrustProps) {
  return (
    <Section title={content.sectionTitle}>
      <div className="grid grid-cols-1 gap-16 md:grid-cols-3 md:gap-8 mt-4">
        {content.items.map((item) => (
          <article className="flex flex-col gap-3 text-center" key={item.value}>
            <p className="font-barlow text-base text-neutral-500 ">
              {item.label}
            </p>
            <p className="font-barlow-condensed font-bold text-[50px] lg:text-[80px] leading-none">
              {item.prefix && (
                <span className="text-gray-900">{item.prefix}</span>
              )}
              <span className="text-light-blue">{item.value}</span>
            </p>
          </article>
        ))}
      </div>
      <p className="mt-10 text-xs text-neutral-400">{content.footnote}</p>
    </Section>
  );
}
