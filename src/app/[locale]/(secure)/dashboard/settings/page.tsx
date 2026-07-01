"use client";

import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import SecureRoute from "@/components/auth/SecureRoute";
import LoadingSpinner from "@/components/layout/LoadingSpinner";
import HeaderHero from "@/components/journey/HeaderHero";
import { hasLocale } from "@/lib/i18n/config";
import { getDictionary, type Dictionary } from "@/lib/i18n/dictionaries";
import { AccountSettingsPanel } from "@/components/app/account/AccountSettingsPanel";

function SettingsContent() {
  const params = useParams();
  const localeParam = (params?.locale as string) ?? "es";
  const resolvedLocale = hasLocale(localeParam) ? localeParam : "es";
  const [dict, setDict] = useState<Dictionary | null>(null);

  useEffect(() => {
    getDictionary(resolvedLocale).then(setDict);
  }, [resolvedLocale]);

  if (!dict) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <LoadingSpinner />
      </div>
    );
  }

  const p = dict.profile;

  return (
    <>
      <HeaderHero
        className="h-[40vh]"
        fallbackImage="/images/hero-image-1.jpeg"
        subtitle={p.hero.subtitle}
        title={p.hero.title}
        videoSrc="/videos/hero-video-1.mp4"
      />
      <section className="bg-neutral-50 py-10">
        <div className="mx-auto max-w-6xl px-4">
          <AccountSettingsPanel role="client" />
        </div>
      </section>
    </>
  );
}

const SettingsPage = dynamic(() => Promise.resolve(SettingsPageComponent), {
  ssr: false,
});

function SettingsPageComponent() {
  return (
    <SecureRoute>
      <SettingsContent />
    </SecureRoute>
  );
}

export default SettingsPage;
