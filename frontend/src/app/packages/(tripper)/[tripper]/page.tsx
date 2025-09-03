// frontend/src/app/packages/(tripper)/[tripper]/page.tsx
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { TRIPPERS, getTripperBySlug } from "@/content/trippers";
import TripperHero from "@/components/tripper/TripperHero";
import TripperPlanner from "@/components/tripper/TripperPlanner";
import TripperBlog from "@/components/tripper/TripperBlog";
import dynamic from "next/dynamic";
const TripperVisitedMap = dynamic(
  () => import("@/components/tripper/TripperVisitedMap"),
  { ssr: false, loading: () => <div className="h-72 rounded-xl bg-gray-100" /> }
);
import TripperTestimonials from "@/components/tripper/TripperTestimonials";
import TripperClosing from "@/components/tripper/TripperClosing";

// 👇 Modal de video (client component)
import TripperIntroVideoGate from "@/components/tripper/TripperIntroVideoGate";

export function generateStaticParams() {
  return TRIPPERS.map((t) => ({ tripper: t.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { tripper: string };
}): Promise<Metadata> {
  const t = getTripperBySlug(params.tripper);
  if (!t) return { title: "Randomtrip" };
  return {
    title: `${t.name} | Randomtrip`,
    openGraph: {
      title: `${t.name} | Randomtrip`,
      images: [{ url: t.heroImage || t.avatar, width: 1200, height: 630 }],
    },
  };
}

export default function Page({
  params,
  searchParams,
}: {
  params: { tripper: string };
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  // Guard si viene vacío o 'undefined'
  if (!params?.tripper || params.tripper === "undefined") {
    redirect("/packages/by-type/group");
  }

  const t = getTripperBySlug(params.tripper);
  if (!t) return notFound();

  // QA: permitir forzar el video con ?forcevideo=1
  const forceVideo =
    (typeof searchParams?.forcevideo === "string" && searchParams?.forcevideo === "1") ||
    (Array.isArray(searchParams?.forcevideo) && searchParams?.forcevideo?.[0] === "1");

  // Clave específica por tripper para que no se mezcle el “no volver a mostrar”
  const storageKey = `rt_tripper_intro_seen:${t.slug}`;

  return (
    <main className="bg-white text-slate-900">
      {/* 🔔 Modal de intro. 
          Se muestra si el usuario entra directo (referrer externo) y no marcó “no volver a mostrar”.
          - Se puede forzar con ?forcevideo=1
          - Se puede bloquear con ?novideo=1 (lo maneja el propio componente)
      */}
      <TripperIntroVideoGate
        youtubeId="1d4OiltwQYs"
        storageKey={storageKey}
        forceShow={!!forceVideo}
      />

      {/* Hero */}
      <TripperHero t={t} />

      {/* Planner: pasar también el slug para construir rutas del funnel */}
      <TripperPlanner t={t} />

      {/* Blog / inspiración */}
      <TripperBlog posts={t.posts || []} sectionId="tripper-blog" />

      {/* Mapa (CSR) */}
      <TripperVisitedMap places={t.visitedPlaces || []} />

      {/* Opiniones */}
      <TripperTestimonials testimonials={t.testimonials || []} />

      {/* Cierre */}
      <TripperClosing />

      <footer className="py-12 text-center text-gray-500 border-t">
        © 2025 Randomtrip. Where the routine ends, the adventure begins.
      </footer>

      {/* JSON-LD SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            name: t.name,
            jobTitle: "Travel Advisor",
            image: t.heroImage || t.avatar,
            worksFor: t.agency || "Randomtrip",
            homeLocation: t.location || undefined,
          }),
        }}
      />
    </main>
  );
}
