"use client";

import type { Tripper } from "@/content/trippers";
import Image from "next/image";

export default function TripperSpecialties({ tripper }: { tripper: Tripper }) {
  const s = tripper.specialties;
  const hasData = (s?.interests && s.interests.length) || (s?.destinations && s.destinations.length) || (s?.certifications && s.certifications.length) || (s?.languages && s.languages.length) || (s?.partnerBadges && s.partnerBadges.length);

  if (!hasData) return null;

  return (
    <section id="travel-specialties" className="rt-container px-4 md:px-8 py-12">
      <h2 className="text-2xl md:text-3xl font-semibold mb-6">Travel Specialties</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {s?.interests && s.interests.length > 0 && (
          <div>
            <h3 className="text-sm uppercase text-neutral-500 font-semibold mb-2">Interests</h3>
            <ul className="space-y-1">
              {s.interests.map((item, index) => (
                <li key={index} className="text-neutral-700">{item}</li>
              ))}
            </ul>
          </div>
        )}

        {s?.destinations && s.destinations.length > 0 && (
          <div>
            <h3 className="text-sm uppercase text-neutral-500 font-semibold mb-2">Destinations</h3>
            <ul className="space-y-1">
              {s.destinations.map((item, index) => (
                <li key={index} className="text-neutral-700">{item}</li>
              ))}
            </ul>
          </div>
        )}

        {s?.certifications && s.certifications.length > 0 && (
          <div>
            <h3 className="text-sm uppercase text-neutral-500 font-semibold mb-2">Certifications</h3>
            <ul className="space-y-1">
              {s.certifications.map((item, index) => (
                <li key={index} className="text-neutral-700">{item}</li>
              ))}
            </ul>
          </div>
        )}

        {s?.languages && s.languages.length > 0 && (
          <div>
            <h3 className="text-sm uppercase text-neutral-500 font-semibold mb-2">Languages</h3>
            <ul className="space-y-1">
              {s.languages.map((item, index) => (
                <li key={index} className="text-neutral-700">{item}</li>
              ))}
            </ul>
          </div>
        )}

        {s?.partnerBadges && s.partnerBadges.length > 0 && (
          <div>
            <h3 className="text-sm uppercase text-neutral-500 font-semibold mb-2">Partners</h3>
            <div className="flex flex-wrap gap-4">
              {s.partnerBadges.map((badge, index) => (
                <a key={index} href={badge.url || "#"} target="_blank" rel="noreferrer" className="flex items-center gap-2">
                  <Image src={badge.logoUrl} alt={badge.name} width={40} height={40} className="object-contain" />
                  <span className="text-neutral-700">{badge.name}</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}