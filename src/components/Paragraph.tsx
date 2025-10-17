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
    <Section className={`px-4 md:px-8 bg-gray-100! w-full ${className}`}>
      <div className="max-w-4xl mx-auto bg-white rounded-lg p-8" id={id}>
        <header className="text-center mb-12">
          <h2 className="text-5xl font-bold mb-6 font-caveat text-gray-900">
            {content.title}
          </h2>
        </header>
        <div className="prose prose-lg max-w-none border-b border-gray-200 ">
          {content.paragraphs.map((paragraph, index) => (
            <p
              key={index}
              className="text-gray-700 leading-relaxed mb-6 font-jost"
            >
              {paragraph}
            </p>
          ))}
        </div>
        <p className="text-lg md:text-xl text-gray-700 font-caveat font-semibold text-center py-4">
          {content.tagline}
        </p>
      </div>
    </Section>
  );
}
