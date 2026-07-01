import Section from "@/components/layout/Section";

interface TrustItem {
  title: string;
  description: string;
}

interface AboutUsTrustContent {
  items: TrustItem[];
  sectionTitle: string;
}

interface AboutUsTrustProps {
  content: AboutUsTrustContent;
}

export function AboutUsTrust({ content }: AboutUsTrustProps) {
  return (
    <Section title={content.sectionTitle}>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 mt-4">
        {content.items.map((item) => (
          <article
            key={item.title}
            className="flex flex-col gap-3 bg-white rounded-2xl p-6 shadow-sm ring-1 ring-gray-100"
          >
            <h3 className="font-barlow-condensed font-bold text-xl uppercase text-primary">
              {item.title}
            </h3>
            <p className="font-barlow text-sm text-neutral-600 leading-relaxed">
              {item.description}
            </p>
          </article>
        ))}
      </div>
    </Section>
  );
}
