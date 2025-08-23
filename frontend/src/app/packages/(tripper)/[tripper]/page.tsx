import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { TRIPPERS, getTripperBySlug } from "@/content/trippers";
import TripperProfile from "@/components/tripper/TripperProfile";
import TripperPlanner from "@/components/tripper/TripperPlanner";
import TripperBlog from "@/components/tripper/TripperBlog";
import dynamic from "next/dynamic";
const TripperVisitedMap = dynamic(
  () => import("@/components/tripper/TripperVisitedMap"),
  { ssr: false, loading: () => <div className="h-72 rounded-xl bg-gray-100" /> }
);
import TripperTestimonials from "@/components/tripper/TripperTestimonials";
import TripperClosing from "@/components/tripper/TripperClosing";

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

export default function Page({ params }: { params: { tripper: string } }) {
  // Guard si viene vacío o 'undefined'
  if (!params?.tripper || params.tripper === "undefined") {
    redirect("/packages/by-type/group");
  }

  const t = getTripperBySlug(params.tripper);
  if (!t) return notFound();

  return (
    <main className="bg-white text-slate-900">
      <TripperProfile t={t} />
      <TripperPlanner tripperName={t.name} />
      <TripperBlog posts={t.posts || []} sectionId="tripper-blog" />
      <TripperVisitedMap places={t.visitedPlaces || []} />
      <TripperTestimonials testimonials={t.testimonials || []} />
      <TripperClosing />
      <footer className="py-12 text-center text-gray-500 border-t">
        © 2025 Randomtrip. Where the routine ends, the adventure begins.
      </footer>
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
