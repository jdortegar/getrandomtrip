import Img from '@/components/common/Img';
import Section from '@/components/layout/Section';

// ─── Props ────────────────────────────────────────────────────────────────────

interface PhilosophyContent {
  imageAlt: string;
  p1: string;
  p2: string;
  pills?: string[];
  sectionTitle: string;
}

interface AboutUsPhilosophyProps {
  content: PhilosophyContent;
  imageSrc?: string;
  inverted?: boolean;
  tags?: string[];
  imageClassName?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AboutUsPhilosophy({
  content,
  imageSrc = '/images/about-us-philosophy.png',
  inverted = false,
  tags,
  imageClassName,
}: AboutUsPhilosophyProps) {
  return (
    <Section>
      <div className="grid grid-cols-1 md:grid-cols-2 min-h-[540px]">
        {/* Image */}
        <div className={`relative min-h-72 md:min-h-full rounded-xl overflow-hidden ${inverted ? 'md:order-first' : 'md:order-last'}`}>
          <Img
            alt={content.imageAlt}
            className={`absolute inset-0 h-full w-full object-cover ${imageClassName ?? ''}`}
            height={720}
            src={imageSrc}
            width={720}
          />
          {tags && tags.length > 0 && (
            <div className="absolute right-5 top-1/2 -translate-y-1/2 flex flex-col gap-3">
              {tags.map((tag) => (
                <span
                  className="font-barlow-condensed text-sm font-bold tracking-widest text-white/90 drop-shadow"
                  key={tag}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Text */}
        <div className="text-left flex flex-col justify-center gap-6 px-10 py-16 lg:px-16">
          <h2 className="font-barlow-condensed font-bold text-[70px] uppercase leading-tight text-gray-900">
            {content.sectionTitle}
          </h2>

          <div className="flex flex-col gap-4">
            <p className="font-barlow text-base text-neutral-600 leading-relaxed">
              {content.p1}
            </p>
            <p className="font-barlow text-base text-neutral-600 leading-relaxed">
              {content.p2}
            </p>
          </div>

         
        </div>
      </div>
    </Section>
  );
}
