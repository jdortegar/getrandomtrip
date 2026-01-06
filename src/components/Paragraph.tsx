import BrandingAnimation from './BrandingAnimation';
import Section from './layout/Section';

export interface ParagraphContent {
  title: string;
  paragraphs: string[];
  tagline: string;
}

interface ParagraphProps {
  content: ParagraphContent;
  id?: string;
  className?: string;
}

export default function Paragraph({
  content,
  id,
  className = '',
}: ParagraphProps) {
  return (
    <Section eyebrow={content.tagline} title={content.title}>
      <div>
        <div className="prose prose-md md:max-w-1/2 mx-auto text-center border-gray-200 text-gray-700">
          {content.paragraphs.map((paragraph, index) => (
            <p key={index} className="leading-relaxed mb-6 text-2xl">
              {paragraph}
            </p>
          ))}
        </div>
        <div className="flex items-center justify-center mt-20">
          <BrandingAnimation className=" text-[#4F96B6]" />
        </div>
      </div>
    </Section>
  );
}
