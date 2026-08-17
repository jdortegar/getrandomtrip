"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, Calendar, Check, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import LoadingSpinner from "@/components/layout/LoadingSpinner";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { hasLocale, DEFAULT_LOCALE } from "@/lib/i18n/config";
import { formatAdminDate } from "@/lib/admin/format";
import { interpolateTemplate } from "@/lib/helpers/interpolateTemplate";
import type { TripItineraryDict } from "@/lib/types/dictionary";
import type { TripDetailsData } from "@/types/tripDetails";
import { TripDetailsHero } from "./TripDetailsHero";
import { BODY_LOCK_CLASS, TripScratchReveal } from "./TripScratchReveal";
import { TripDetailsBackRow } from "./TripDetailsBackRow";
import { TripEssentialsStrip } from "./TripEssentialsStrip";
import { TripItineraryTimeline } from "./TripItineraryTimeline";
import { TripDetailsHelpStrip } from "./TripDetailsHelpStrip";
import { TripSupportModal } from "./TripSupportModal";
import { TripDocumentsSection } from "./TripDocumentsSection";
import { resolveTripDestination, resolveTripOrigin } from "./tripDetailsHelpers";
import styles from "./traveler-trip-details.module.css";

/** Self-contained: fetches its own trip data and dictionary, so it can be
 * mounted directly from the reveal page's post-reveal branch with no props. */
export function TripItineraryContent() {
  const params = useParams();
  const { data: session } = useSession();
  const [trip, setTrip] = useState<TripDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copy, setCopy] = useState<TripItineraryDict | null>(null);
  const [supportOpen, setSupportOpen] = useState(false);
  const [heroRevealed, setHeroRevealed] = useState(false);
  const [mainVisible, setMainVisible] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  const tripId = params.id as string;
  const rawLocale = (params.locale as string) ?? "es";
  const locale = hasLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;

  useEffect(() => {
    getDictionary(locale).then((d) => setCopy(d.tripItinerary));
  }, [locale]);

  useEffect(() => {
    if (!session?.user?.id) return;
    fetch(`/api/trips/${tripId}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) setTrip(data.trip as TripDetailsData);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session, tripId]);

  // Body scroll lock while the scratch gate is up — a class (not an inline
  // style) so it composes cleanly and always cleans up on completion/unmount.
  useEffect(() => {
    if (heroRevealed) return;
    document.body.classList.add(BODY_LOCK_CLASS);
    return () => {
      document.body.classList.remove(BODY_LOCK_CLASS);
    };
  }, [heroRevealed]);

  // Force a reflow before flipping the stagger class — without it, the browser
  // can coalesce <main>'s hidden-state paint with the revealed-state paint and
  // skip the transition entirely. Nested requestAnimationFrame is not a
  // reliable substitute in throttled/embedded contexts.
  useEffect(() => {
    if (!heroRevealed) return;
    const el = mainRef.current;
    if (el) void el.offsetHeight;
    setMainVisible(true);
  }, [heroRevealed]);

  const handleScratchComplete = useCallback(({ instant }: { instant: boolean }) => {
    setHeroRevealed(true);
    if (instant) return;
    window.setTimeout(() => {
      window.scrollTo({ top: Math.round(window.innerHeight * 0.18), behavior: "smooth" });
    }, 1400);
  }, []);

  if (loading || !copy) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <LoadingSpinner />
      </div>
    );
  }

  // The API omits itinerary/inclusions/exclusions/documents entirely for a
  // non-fulfillment-visible status (server-side gate in GET /api/trips/[id],
  // design.md ADR-7) — the `.root` subtree is never mounted for those
  // statuses; a plain pre-reveal notice renders instead.
  const isPreReveal = !!trip && trip.documents === undefined;

  if (isPreReveal) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-6">
          <Button asChild size="sm" variant="ghost">
            <Link href={`/${locale}/dashboard/trips/${tripId}`}>
              <ArrowLeft className="h-4 w-4" />
              {copy.backToTrip}
            </Link>
          </Button>
        </div>
        <div className="flex flex-col items-center gap-4 rounded-lg border border-gray-200 bg-white p-10 text-center shadow-sm">
          <Calendar className="h-10 w-10 text-gray-300" />
          <h3 className="text-lg font-semibold text-neutral-900">{copy.preRevealTitle}</h3>
          <p className="max-w-sm text-sm text-gray-500">{copy.preRevealDescription}</p>
        </div>
      </div>
    );
  }

  if (!trip) return null;

  const itinerary = trip.experience?.itinerary ?? null;
  const hasItinerary = Array.isArray(itinerary) && itinerary.length > 0;
  const inclusions = (trip.experience?.inclusions ?? []).map(String).filter(Boolean);
  const exclusions = (trip.experience?.exclusions ?? []).map(String).filter(Boolean);
  const documents = trip.documents ?? [];
  const destination = resolveTripDestination(trip, copy.hero.destinationFallback);
  const origin = resolveTripOrigin(trip);

  return (
    <div className={styles.root}>
      <TripScratchReveal copy={copy.scratch} onComplete={handleScratchComplete} tripId={tripId}>
        <TripDetailsHero copy={copy.hero} locale={locale} trip={trip} />
      </TripScratchReveal>

      {heroRevealed && (
        <main
          className={`${styles.wrap} ${mainVisible ? styles.mainRevealed : ""}`}
          ref={mainRef}
        >
          <div className={styles.mainBlock}>
            <TripDetailsBackRow copy={copy} locale={locale} tripId={tripId} />
          </div>

          <section className={`${styles.block} ${styles.mainBlock}`}>
            <TripEssentialsStrip
              copy={copy.essentials}
              nights={trip.nights}
              origin={origin}
              pax={trip.pax}
              travelType={trip.type}
            />
          </section>

          {!trip.experience && (
            <section className={`${styles.block} ${styles.mainBlock}`} id="itinerary">
              <div className="flex flex-col items-center gap-4 rounded-lg border border-gray-200 bg-white p-10 text-center shadow-sm">
                <Calendar className="h-10 w-10 text-gray-300" />
                <p className="text-sm text-gray-500">{copy.noExperience}</p>
              </div>
            </section>
          )}

          {trip.experience && !hasItinerary && (
            <section className={`${styles.block} ${styles.mainBlock}`} id="itinerary">
              <div className="flex flex-col items-center gap-4 rounded-lg border border-gray-200 bg-white p-10 text-center shadow-sm">
                <Calendar className="h-10 w-10 text-gray-300" />
                <h3 className="text-lg font-semibold text-neutral-900">{copy.emptyTitle}</h3>
                <p className="max-w-sm text-sm text-gray-500">{copy.emptyDescription}</p>
              </div>
            </section>
          )}

          {hasItinerary && (
            <div className={styles.mainBlock}>
              <TripItineraryTimeline
                copy={copy}
                days={itinerary!}
                locale={locale}
                startDate={trip.startDate}
              />
            </div>
          )}

          {/* Inclusions / exclusions — the prototype has no section for them
              (proposal "Out of Scope"), but the card chrome, icons, and
              colors now follow this page's own established conventions
              instead of generic Tailwind defaults. */}
          {(inclusions.length > 0 || exclusions.length > 0) && (
            <section className={`${styles.block} ${styles.mainBlock}`}>
              <div className={styles.docGrid}>
                {inclusions.length > 0 && (
                  <div className={styles.inclCard}>
                    <h4 className={styles.inclCardTitle}>{copy.inclusions}</h4>
                    <ul className={styles.inclList}>
                      {inclusions.map((item, i) => (
                        <li className={`${styles.inclItem} ${styles.inclItemOk}`} key={i}>
                          <Check aria-hidden="true" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {exclusions.length > 0 && (
                  <div className={styles.inclCard}>
                    <h4 className={styles.inclCardTitle}>{copy.exclusions}</h4>
                    <ul className={styles.inclList}>
                      {exclusions.map((item, i) => (
                        <li className={`${styles.inclItem} ${styles.inclItemNo}`} key={i}>
                          <X aria-hidden="true" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </section>
          )}

          <div className={styles.mainBlock}>
            <TripDocumentsSection copy={copy} documents={documents} status={trip.status} />
          </div>

          <div className={styles.mainBlock}>
            <TripDetailsHelpStrip copy={copy} onOpen={() => setSupportOpen(true)} />
          </div>
        </main>
      )}

      {trip.destinationRevealedAt ? (
        <footer className={styles.pagefoot}>
          {interpolateTemplate(copy.footer.line, {
            date: formatAdminDate(trip.destinationRevealedAt),
            tripId: trip.id,
          })}
        </footer>
      ) : null}

      <TripSupportModal
        copy={copy}
        destination={destination}
        onClose={() => setSupportOpen(false)}
        open={supportOpen}
        startDate={trip.startDate}
        tripId={trip.id}
        user={{ email: session?.user?.email ?? null, name: session?.user?.name ?? null }}
      />
    </div>
  );
}
