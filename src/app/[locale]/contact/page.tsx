import type { Metadata } from "next";
import { ContactPageContent } from "@/components/app/contact/ContactPageContent";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { hasLocale } from "@/lib/i18n/config";
import HeaderHero from "@/components/journey/HeaderHero";

type LocaleParams = { params: { locale?: string | string[] } };

export async function generateMetadata({
  params,
}: LocaleParams): Promise<Metadata> {
  const raw = params?.locale;
  const locale = typeof raw === "string" ? raw : raw?.[0];
  const dict = await getDictionary(hasLocale(locale) ? locale : "es");
  const meta = dict.contactPage.meta;
  return {
    description: meta.description,
    openGraph: {
      description: meta.openGraphDescription,
      title: meta.openGraphTitle,
      type: "website",
    },
    title: meta.title,
  };
}

export default async function ContactPage({ params }: LocaleParams) {
  const raw = params?.locale;
  const locale = typeof raw === "string" ? raw : raw?.[0];
  const dict = await getDictionary(hasLocale(locale) ? locale : "es");
  const c = dict.contactPage;

  return (
    <>
      <HeaderHero
        className="h-[28vh]!"
        description={c.hero.description}
        fallbackImage="/images/hero-image-1.jpeg"
        subtitle=""
        title={c.hero.title}
        videoSrc="/videos/hero-video-1.mp4"
      />
      <div className="bg-neutral-50 text-neutral-900">
        <section className="py-20">
          <div className="container mx-auto max-w-6xl px-4">
            <ContactPageContent copy={c} />
          </div>
        </section>
      </div>
    </>
  );
}
