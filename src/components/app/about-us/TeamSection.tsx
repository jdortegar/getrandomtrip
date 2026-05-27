import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import Img from '@/components/common/Img';
import Section from '@/components/layout/Section';

// ─── Props ────────────────────────────────────────────────────────────────────

interface TeamMember {
  bio: string;
  img: string;
  linkedin: string;
  name: string;
  role: string;
}

interface TeamSectionContent {
  eyebrow: string;
  items: TeamMember[];
  sectionTitle: string;
  subtitle: string;
}

interface TeamSectionProps {
  content: TeamSectionContent;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TeamSection({ content }: TeamSectionProps) {
  return (
    <Section
      eyebrow={content.eyebrow}
      title={content.sectionTitle}
      subtitle={content.subtitle}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mt-4">
        {content.items.map((member) => {
          return (
            <div key={member.name} className="flex flex-col gap-3">
              {/* Photo card */}
              <div className="relative aspect-[3/4] rounded-xl overflow-hidden">
                <Img
                  alt={member.name}
                  className="absolute inset-0 h-full w-full object-cover object-top"
                  height={600}
                  src={member.img}
                  width={450}
                />
                {/* Gradient overlay */}
                {/* <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="font-barlow-condensed font-extrabold text-[28px] md:text-[32px] uppercase leading-none text-white drop-shadow">
                    {firstName}
                  </p>
                  <p className="font-barlow-condensed font-extrabold text-[28px] md:text-[32px] uppercase leading-none text-white drop-shadow">
                    {lastName}
                  </p>
                </div> */}
              </div>

              {/* Info row */}
              <div className="flex items-start justify-between gap-2 text-left px-4">
                <div>
                  <p className="font-barlow font-semibold text-2xl text-neutral-900 leading-tight">
                    {member.name}
                  </p>
                  <p className="font-barlow text-sm text-neutral-500">
                    {member.role}
                  </p>
                </div>
                <Link
                  aria-label={`LinkedIn de ${member.name}`}
                  className="shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-primary text-white hover:bg-primary/90 transition-colors mt-0.5"
                  href={member.linkedin}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
