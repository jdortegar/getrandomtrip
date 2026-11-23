"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useLenis } from "lenis/react";
import { Calendar, Check, X } from "lucide-react";
import LoadingSpinner from "@/components/layout/LoadingSpinner";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { hasLocale, DEFAULT_LOCALE } from "@/lib/i18n/config";
import { pathForLocale } from "@/lib/i18n/pathForLocale";
import { hasSeenReveal, markRevealSeen } from "@/lib/helpers/revealSeen";
import { formatAdminDate } from "@/lib/admin/format";
import { interpolateTemplate } from "@/lib/helpers/interpolateTemplate";
import type { TripItineraryDict } from "@/lib/types/dictionary";
import type { TripDetailsData } from "@/types/tripDetails";
import { FALLBACK_HERO_IMAGE, TRIP_GUIDE_ID, TripDestinationHero } from "./TripDestinationHero";
import { TripGuide } from "./TripGuide";
import { BODY_LOCK_CLASS, TripBoardReveal } from "./TripBoardReveal";
import { TriggerRevealAnimation } from "./TriggerRevealAnimation";
import { TripEssentialsStrip } from "./TripEssentialsStrip";
import { TripItineraryTimeline } from "./TripItineraryTimeline";
import { TripDetailsHelpStrip } from "./TripDetailsHelpStrip";
import { TripSupportModal } from "./TripSupportModal";
import { TripDocumentsSection } from "./TripDocumentsSection";
import {
  resolveBoardDestination,
  resolveDestinationCountry,
  resolveGuidePhotos,
  resolveTripDestination,
  resolveTripOrigin,
} from "./tripDetailsHelpers";
import styles from "./traveler-trip-details.module.css";

function isRevealedStatus(status: string): boolean {
  return status === "REVEALED" || status === "COMPLETED";
}

/** Self-contained: fetches its own trip data and dictionary, so the
 * destination page mounts it with no props. A trip that isn't revealed (or
 * can't be loaded) is sent back to the trip-details page, which owns the
 * countdown and the not-found state. */
export function TripItineraryContent() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [trip, setTrip] = useState<TripDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copy, setCopy] = useState<TripItineraryDict | null>(null);
  const [supportOpen, setSupportOpen] = useState(false);
  const tripIdParam = params.id as string;
  // Read once on mount: a traveler who already saw this reveal opens on the hero.
  const [startRevealed] = useState(() => hasSeenReveal(tripIdParam));
  const [heroRevealed, setHeroRevealed] = useState(startRevealed);
  // Bumped by "Relive the reveal": remounts the gate as a fresh run.
  const [revealRun, setRevealRun] = useState(0);
  const lenis = useLenis();
  const mainRef = useRef<HTMLElement>(null);

  const tripId = tripIdParam;
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

  // Not revealed yet (the API omits documents for a non-fulfillment status,
  // design.md ADR-7) or not loadable: the details page has the countdown and
  // the not-found state.
  const notViewable = !loading && (!trip || trip.documents === undefined || !isRevealedStatus(trip.status));
  const revealGateVisible = !loading && !!copy && !notViewable && !heroRevealed;

  // Body scroll lock while the reveal gate is up — a class (not an inline
  // style) so it composes cleanly and always cleans up on completion/unmount.
  useEffect(() => {
    if (!revealGateVisible) return;
    document.body.classList.add(BODY_LOCK_CLASS);
    return () => {
      document.body.classList.remove(BODY_LOCK_CLASS);
    };
  }, [revealGateVisible]);

  // Force a reflow before flipping the stagger class — without it, the browser
  // can coalesce <main>'s hidden-state paint with the revealed-state paint and
  // skip the transition entirely. Nested requestAnimationFrame is not a
  // reliable substitute in throttled/embedded contexts.
  useEffect(() => {
    if (!heroRevealed) return;
    const el = mainRef.current;
    if (el) void el.offsetHeight;
    el?.classList.add(styles.mainRevealed);
    // `loading`/`copy`: when the page opens already revealed, <main> only
    // mounts after the data arrives, so re-run once it exists.
  }, [heroRevealed, loading, copy]);

  // The full-viewport hero carries its own "Explore my trip" button down to
  // the guide, so the page stays on the destination when the reveal ends.
  // Revealing or skipping both count as "seen"; leaving mid-gate does not.
  const handleRevealComplete = useCallback(() => {
    markRevealSeen(tripId);
    setHeroRevealed(true);
  }, [tripId]);

  // Back to the ready screen at the top of the page, with the guide hidden and
  // scroll locked again until the traveler reveals (or skips) once more.
  const handleReplay = useCallback(() => {
    if (lenis) lenis.scrollTo(0, { immediate: true });
    else window.scrollTo({ top: 0 });
    setHeroRevealed(false);
    setRevealRun((run) => run + 1);
  }, [lenis]);

  useEffect(() => {
    if (notViewable) router.replace(pathForLocale(locale, `/dashboard/trips/${tripId}`));
  }, [notViewable, router, locale, tripId]);

  if (loading || !copy || notViewable) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white" data-component="TripItineraryContent">
        <LoadingSpinner />
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
  const boardPlace = resolveBoardDestination(trip, copy.hero.destinationFallback);

  return (
    <div className={styles.root} data-component="TripItineraryContent">
      <TripBoardReveal
        copy={copy.boardReveal}
        focusCta={revealRun > 0}
        key={revealRun}
        startRevealed={revealRun === 0 && startRevealed}
        destination={boardPlace}
        locale={locale}
        onComplete={handleRevealComplete}
        tripId={tripId}
      >
        <TripDestinationHero copy={copy.hero} trip={trip} />
      </TripBoardReveal>

      {heroRevealed && (
        <TriggerRevealAnimation
          copy={copy.revealReplay}
          detailsHref={pathForLocale(locale, `/dashboard/trips/${tripId}`)}
          onReplay={handleReplay}
        />
      )}

      {heroRevealed && (
        <main className={styles.wrap} id={TRIP_GUIDE_ID} ref={mainRef}>
          <section className={`${styles.block} ${styles.mainBlock}`}>
            <TripEssentialsStrip
              copy={copy.essentials}
              nights={trip.nights}
              origin={origin}
              pax={trip.pax}
              travelType={trip.type}
            />
          </section>

          <div className={styles.mainBlock}>
            <TripGuide
              body={trip.experience?.description}
              copy={copy.guide}
              photos={resolveGuidePhotos(trip, FALLBACK_HERO_IMAGE)}
              place={[boardPlace, resolveDestinationCountry(trip)].filter(Boolean).join(", ").toLocaleUpperCase(locale)}
              stay={trip.experience?.hotelName}
              title={trip.experience?.title}
            />
          </div>

          {!trip.experience && (
            <section className={`${styles.block} ${styles.mainBlock}`} id="itinerary">
              <div className={styles.emptyState}>
                <Calendar aria-hidden="true" />
                <p>{copy.noExperience}</p>
              </div>
            </section>
          )}

          {trip.experience && !hasItinerary && (
            <section className={`${styles.block} ${styles.mainBlock}`} id="itinerary">
              <div className={styles.emptyState}>
                <Calendar aria-hidden="true" />
                <h3 className={styles.cond}>{copy.emptyTitle}</h3>
                <p>{copy.emptyDescription}</p>
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
            <TripDocumentsSection copy={copy} documents={documents} locale={locale} status={trip.status} />
          </div>

          <div className={styles.mainBlock}>
            <TripDetailsHelpStrip copy={copy} onOpen={() => setSupportOpen(true)} />
          </div>
        </main>
      )}


      {heroRevealed && trip.destinationRevealedAt ? (
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
