'use client';

import type { Tripper } from '@/content/trippers';
import SafeImage from '@/components/common/SafeImage';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { useMemo } from 'react';

export default function TripperHero({ t }: { t: Tripper }) {
  const videoId = 'xDEsbj4mDR0';
  const firstName = useMemo(
    () => t.name?.split(' ')[0] ?? t.name ?? '',
    [t.name],
  );
  const hasLists = Boolean(t.interests?.length || t.destinations?.length);

  return (
    <section
      className="relative bg-slate-950 text-white pb-20"
      id="tripper-hero"
    >
      <div className="mx-auto">
        <div className="">
          {/* Header Image */}
          <div className="relative h-[40vh] w-full overflow-hidden z-0">
            <SafeImage
              alt={`Banner de ${t.name}`}
              className="object-cover"
              fill
              priority
              sizes="100vw"
              src={t.heroImage || t.avatar || null}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/50 to-slate-950/80"></div>
          </div>

          {/* Right Column - Content */}
          <div className="relative flex flex-col gap-8 px-6 mt-[-100px] z-10 max-w-7xl mx-auto">
            {/* Avatar */}
            <div className="flex gap-6 items-end">
              <div className="h-80 w-80 overflow-hidden rounded-sm bg-slate-800 ring-4 ring-white/70 shadow-2xl ">
                <SafeImage
                  alt={`Retrato de ${t.name}`}
                  className="object-cover"
                  fill
                  priority
                  sizes="(max-width: 640px) 128px, 160px"
                  src={t.avatar || t.heroImage || null}
                />
              </div>

              {/* Name, Location & Tier */}
              <div className="flex flex-col gap-6">
                <div className="text-center lg:text-left">
                  <h1 className="font-caveat text-5xl font-bold leading-tight sm:text-6xl">
                    {t.name}
                  </h1>
                  {t.location && (
                    <p className="mt-2 text-lg text-white/80">{t.location}</p>
                  )}
                  {t.tierLevel && (
                    <div className="mt-3 flex flex-wrap gap-2 justify-center lg:justify-start">
                      <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs uppercase tracking-wide text-white/80">
                        Tier: {t.tierLevel}
                      </span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <Button asChild size="lg" variant="outline">
                    <a
                      aria-label={`Planear un Randomtrip con ${firstName}`}
                      href="#planner"
                    >
                      Randomtrip ft. {firstName}
                    </a>
                  </Button>
                  <Button asChild size="lg" variant="secondary">
                    <a
                      aria-label={`Ver las mejores historias de ${firstName}`}
                      href="#tripper-blog"
                    >
                      Las mejores historias
                    </a>
                  </Button>
                </div>
              </div>
            </div>
            {/* Accordion */}
            <Accordion
              className="border-t border-white/10"
              defaultValue="bio"
              type="single"
              collapsible
            >
              <AccordionItem className="border-white/10" value="bio">
                <AccordionTrigger className="text-lg font-semibold text-white hover:text-white/80 hover:no-underline">
                  Biografía
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 text-base leading-relaxed text-white/90">
                    {t.bio ? (
                      <p>{t.bio}</p>
                    ) : (
                      <p className="text-white/60">
                        Pronto conocerás más sobre {firstName}.
                      </p>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {hasLists && (
                <>
                  <AccordionItem className="border-white/10" value="expertise">
                    <AccordionTrigger className="text-lg font-semibold text-white hover:text-white/80 hover:no-underline">
                      Áreas de Expertise
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                        {t.interests?.length ? (
                          <div>
                            <ul className="mt-3 space-y-2 text-sm text-white/80">
                              {t.interests.map((interest) => (
                                <li key={interest}>• {interest}</li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem
                    className="border-white/10"
                    value="paises-ciudades"
                  >
                    <AccordionTrigger className="text-lg font-semibold text-white hover:text-white/80 hover:no-underline">
                      Países/Ciudades
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 text-base leading-relaxed text-white/90">
                        {t.destinations?.length ? (
                          <ul className="mt-3 space-y-2 text-sm text-white/80">
                            {t.destinations.map((destination) => (
                              <li key={destination}>• {destination}</li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </>
              )}
            </Accordion>
          </div>
        </div>
      </div>
    </section>
  );
}
