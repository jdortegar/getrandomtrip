"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import Img from "@/components/common/Img";
import Section from "@/components/layout/Section";

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface TeamMember {
  bio: string;
  img: string;
  linkedin: string;
  name: string;
  role: string;
  tagline?: string;
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
  const [flippedCard, setFlippedCard] = useState<string | null>(null);
  const [mobileFlippedCard, setMobileFlippedCard] = useState<string | null>(null);
  const [supportsHover, setSupportsHover] = useState(false);

  useEffect(() => {
    setSupportsHover(window.matchMedia("(hover: hover)").matches);
  }, []);

  const handleDesktopHover = (name: string | null) => setFlippedCard(name);
  const handleMobileFlip = (name: string) =>
    setMobileFlippedCard((prev) => (prev === name ? null : name));

  return (
    <Section
      eyebrow={content.eyebrow}
      title={content.sectionTitle}
      subtitle={content.subtitle}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-4">
        {content.items.map((member) => {
          const isFlipped =
            flippedCard === member.name || mobileFlippedCard === member.name;
          const roleFormatted = member.role
            .split(" ")
            .join(" - ")
            .toUpperCase();

          return (
            <div key={member.name} className="flex flex-col gap-3">
              {/* Flip card wrapper */}
              <div
                className="relative aspect-3/4 rounded-xl cursor-pointer select-none"
                style={{ perspective: "1000px" }}
                onMouseEnter={supportsHover ? () => handleDesktopHover(member.name) : undefined}
                onMouseLeave={supportsHover ? () => handleDesktopHover(null) : undefined}
                onClick={!supportsHover ? () => handleMobileFlip(member.name) : undefined}
              >
                <motion.div
                  animate={{ rotateY: isFlipped ? 180 : 0 }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                  className="relative w-full h-full"
                  style={{ transformStyle: "preserve-3d" }}
                >
                  {/* Front face */}
                  <div
                    className="absolute inset-0 rounded-xl overflow-hidden"
                    style={{ backfaceVisibility: "hidden" }}
                  >
                    <Img
                      alt={member.name}
                      className="absolute inset-0 h-full w-full object-cover object-top"
                      height={600}
                      src={member.img}
                      width={450}
                    />
                  </div>

                  {/* Back face */}
                  <div
                    className="absolute inset-0 rounded-xl overflow-hidden bg-primary flex flex-col p-4 sm:p-5 lg:p-6 text-left"
                    style={{
                      backfaceVisibility: "hidden",
                      transform: "rotateY(180deg)",
                    }}
                  >
                    {/* Block 1: Role */}
                    <p className="text-[11px] font-medium text-white/55 uppercase tracking-widest">
                      {roleFormatted}
                    </p>
                    {/* Block 2: Bio */}
                    <p className="text-sm text-white/85 leading-relaxed mt-4">
                      {member.bio}
                    </p>
                    {/* Block 3: Tagline */}
                    {member.tagline && (
                      <p className="font-barlow font-bold text-xl lg:text-2xl text-light-blue leading-snug mt-6 lg:mt-auto">
                        {member.tagline}
                      </p>
                    )}
                  </div>
                </motion.div>
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
                  <LinkedInIcon className="h-4 w-4" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
