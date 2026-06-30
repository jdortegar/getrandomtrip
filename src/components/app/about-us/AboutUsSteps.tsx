import Section from "@/components/layout/Section";

interface StepItem {
  description: string;
  key: string;
  title: string;
}

interface AboutUsStepsContent {
  items: StepItem[];
  sectionTitle: string;
  stepLabel: string;
}

interface AboutUsStepsProps {
  content: AboutUsStepsContent;
}

export function AboutUsSteps({ content }: AboutUsStepsProps) {
  return (
    <Section title={content.sectionTitle}>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3 mt-4">
        {content.items.map((step) => (
          <div key={step.key} className="flex flex-col gap-3">
            <span className="font-barlow-condensed font-bold text-5xl text-light-blue leading-none">
              {step.key}
            </span>
            <h3 className="font-barlow font-semibold text-lg text-neutral-900">
              {step.title}
            </h3>
            <p className="font-barlow text-sm text-neutral-600 leading-relaxed">
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}
