import Img from "@/components/common/Img";
import type { Dictionary } from "@/lib/i18n/dictionaries";

interface AboutUsFounderProps {
  content: Dictionary["aboutUs"]["founder"];
}

export function AboutUsFounder({ content }: AboutUsFounderProps) {
  return (
    <section
      aria-labelledby="founder-heading"
      className="bg-white rt-editorial-section text-ink"
      data-component="AboutUsFounder"
    >
      <div className="rt-container rt-editorial-split">
        <div className="rt-editorial-copy text-left">
          <h2 className="rt-editorial-title" id="founder-heading">
            {content.sectionTitle}
          </h2>
          <div className="rt-editorial-body text-neutral-600">
            <p>{content.p1}</p>
            <p>{content.p2}</p>
          </div>
        </div>
        <Img
          alt={content.imageAlt}
          className="h-auto rt-editorial-image w-full"
          height={452}
          sizes="(min-width: 1280px) 662px, (min-width: 1024px) 55vw, (min-width: 768px) 662px, 100vw"
          src="/images/about-us-founder.png"
          width={662}
        />
      </div>
    </section>
  );
}
