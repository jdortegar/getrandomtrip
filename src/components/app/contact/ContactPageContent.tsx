"use client";

import Link from "next/link";
import { Facebook, Instagram } from "lucide-react";
import { useState } from "react";
import { ContactForm } from "@/components/app/contact/ContactForm";
import type { MarketingDictionary } from "@/lib/types/dictionary";

interface ContactPageContentProps {
  copy: MarketingDictionary["contactPage"];
}

export function ContactPageContent({ copy }: ContactPageContentProps) {
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (isSubmitted)
    return (
      <div className="flex min-h-[340px] items-center justify-center rounded-xl px-6 py-16 text-center">
        <div>
          <h3 className="font-barlow-condensed text-5xl font-bold text-neutral-900">
            {copy.form.success.title}
          </h3>
          <p className="mt-4 text-base text-neutral-500">
            {copy.form.success.description}
          </p>
        </div>
      </div>
    );

  return (
    <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
      <div>
        <p className="mb-5 text-base leading-relaxed text-neutral-600">
          {copy.intro.p1}
        </p>
        <p className="mb-5 text-base leading-relaxed text-neutral-600">
          {copy.intro.p2}
        </p>
        <p className="mb-5 text-base leading-relaxed text-neutral-600">
          {copy.intro.p3}
        </p>
        <p className="mb-12 text-base leading-relaxed text-neutral-600">
          {copy.intro.p4}
        </p>

        <h3 className="mb-3 font-barlow-condensed text-4xl font-semibold text-neutral-900">
          {copy.contact.heading}
        </h3>
        <p className="mb-8 text-base text-neutral-600">{copy.contact.email}</p>

        <h3 className="mb-3 font-barlow-condensed text-4xl font-semibold text-neutral-900">
          {copy.contact.socialsHeading}
        </h3>
        <div className="space-y-2">
          <Link
            className="flex items-center gap-2 text-neutral-700 underline-offset-2 hover:underline"
            href="https://www.instagram.com/getrandomtrip"
            target="_blank"
          >
            <Instagram className="h-5 w-5" />
            <span>{copy.contact.socials.instagram}</span>
          </Link>
          <Link
            className="flex items-center gap-2 text-neutral-700 underline-offset-2 hover:underline"
            href="https://www.facebook.com/getrandomtrip"
            target="_blank"
          >
            <Facebook className="h-5 w-5" />
            <span>{copy.contact.socials.facebook}</span>
          </Link>
        </div>
      </div>

      <ContactForm copy={copy.form} onSuccess={() => setIsSubmitted(true)} />
    </div>
  );
}
