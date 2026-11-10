import { PageHeading } from "@/components/layout/PageHeading";
import SectionHeading from "@/components/ui/SectionHeading";
import { GalleryPanel } from "@/components/app/design-system/GalleryPanel";
import { UsageExample } from "@/components/app/design-system/UsageExample";
import type { DesignSystemDict } from "@/lib/types/dictionary";
import { cn } from "@/lib/utils";

interface HeadingExamplesProps {
  copy: DesignSystemDict;
}

export function HeadingExamples({ copy }: HeadingExamplesProps) {
  const labels = copy.headings;
  return (
    <>
      <GalleryPanel title={labels.page}>
        <PageHeading
          description={labels.pageDescription}
          eyebrow={labels.pageEyebrow}
          title={labels.pageTitle}
        />
      </GalleryPanel>
      <div className={cn("gap-6 grid mt-6", "lg:grid-cols-2")}>
        <GalleryPanel title={labels.section}>
          <SectionHeading
            eyebrow={labels.sectionEyebrow}
            subtitle={labels.sectionSubtitle}
            title={labels.sectionTitle}
          />
        </GalleryPanel>
        <GalleryPanel title={labels.sectionLeft}>
          <SectionHeading
            align="left"
            eyebrow={labels.sectionEyebrow}
            subtitle={labels.sectionSubtitle}
            title={labels.sectionTitle}
          />
        </GalleryPanel>
      </div>
      <UsageExample
        code={`<PageHeading eyebrow={copy.eyebrow} title={copy.title} description={copy.lead} />
<SectionHeading align="left" eyebrow={copy.eyebrow} title={copy.title} subtitle={copy.lead} />`}
        label={copy.usage}
      />
    </>
  );
}
