"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { trackCustomEvent } from "@/lib/helpers/tracking/gtm";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { getNextWeekend, toISODate } from "@/lib/helpers/xsed-dates";
import { Accordion } from "@/components/ui/accordion";
import { FormField, FormSelectField } from "@/components/ui/FormField";
import { XsedInternalHero } from "@/components/app/xsed/XsedInternalHero";
import { JourneyActionBar } from "@/components/journey/JourneyActionBar";
import JourneyContentNavigation from "@/components/journey/JourneyContentNavigation";
import JourneyProgressSidebar from "@/components/journey/JourneyProgressSidebar";
import { JourneyDropdown } from "@/components/journey/JourneyDropdown";
import CountrySelector from "@/components/journey/CountrySelector";
import CitySelector from "@/components/journey/CitySelector";
import { XsedSummary } from "@/components/app/xsed/XsedSummary";
import { useUserStore } from "@/store/slices/userStore";
import type { JourneyDetailsStepLabels } from "@/components/journey/JourneyDetailsStep";
import type { JourneyUserBadgeLabels } from "@/components/journey/JourneyUserBadge";
import type { XsedBookDict } from "@/lib/types/dictionary";
import type { XsedTravelType } from "@/types/core";

// ─── Props ────────────────────────────────────────────────────────────────────

interface XsedBookClientProps {
  book: XsedBookDict;
  detailsStepLabels?: JourneyDetailsStepLabels;
  experienceId?: string;
  locale: string;
  userBadgeLabels: JourneyUserBadgeLabels;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function XsedBookClient({
  book,
  detailsStepLabels,
  experienceId,
  locale,
  userBadgeLabels,
}: XsedBookClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status: sessionStatus } = useSession();

  const [originCountry, setOriginCountry] = useState(
    searchParams.get("originCountry") ?? "",
  );
  const [originCountryCode, setOriginCountryCode] = useState("");
  const [originCity, setOriginCity] = useState(
    searchParams.get("originCity") ?? "",
  );
  const [pax, setPax] = useState(2);
  const [travelType, setTravelType] = useState<XsedTravelType | "">("");
  const [openSection, setOpenSection] = useState("origin");
  const [isSaving, setIsSaving] = useState(false);

  const { saturday, sunday } = useMemo(() => getNextWeekend(), []);

  const travelTypeLabel = travelType ? book.travelType[travelType] : "";

  // Derive active tab from the open accordion section
  const activeTab = openSection === "origin" ? "details" : openSection;

  const handleTabChange = (tabId: string) => {
    setOpenSection(tabId === "details" ? "origin" : tabId);
  };

  const handleStepClick = (tabId: string, substepId?: string) => {
    setOpenSection(substepId ?? (tabId === "details" ? "origin" : tabId));
  };

  const handleSummaryEdit = (sectionId: string) => {
    setOpenSection(sectionId);
  };

  const handleOriginCountryChange = (name: string, code: string) => {
    setOriginCountry(name);
    setOriginCountryCode(code);
    setOriginCity("");
    const next = new URLSearchParams(searchParams.toString());
    if (name) next.set("originCountry", name);
    else next.delete("originCountry");
    next.delete("originCity");
    router.replace(`?${next.toString()}`, { scroll: false });
  };

  const handleOriginCityChange = (value: string) => {
    setOriginCity(value);
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set("originCity", value);
    else next.delete("originCity");
    router.replace(`?${next.toString()}`, { scroll: false });
  };

  const isOriginComplete = Boolean(originCountry && originCity);
  const isTravelTypeComplete = Boolean(travelType);
  const canBook = isOriginComplete && isTravelTypeComplete;
  const isAllStepsComplete = canBook;
  const canContinue = isOriginComplete && openSection === "origin";
  const showClearAll = Boolean(
    originCountry || originCity || pax !== 2 || travelType,
  );

  const completedTabIds = [
    ...(isOriginComplete ? ["details"] : []),
    ...(isOriginComplete && openSection === "pax" ? ["pax"] : []),
  ];

  const handleContinue = () => {
    setOpenSection("pax");
  };

  // Solo is one traveler by definition, so its pax is fixed at 1.
  const handleTravelTypeChange = (value: XsedTravelType) => {
    setTravelType(value);
    if (value === "solo") setPax(1);
  };

  const handleClearAll = () => {
    setOriginCountry("");
    setOriginCity("");
    setPax(2);
    setTravelType("");
    setOpenSection("origin");
    router.replace("?", { scroll: false });
  };

  const handleBook = useCallback(async () => {
    if (!originCountry || !originCity) {
      toast.error("Completá país y ciudad de salida para continuar.");
      return;
    }
    if (!travelType) {
      toast.error("Elegí con quién viajás para continuar.");
      return;
    }
    if (sessionStatus === "loading") {
      toast.info("Cargando sesión…");
      return;
    }
    if (!session?.user?.email) {
      const { openAuth } = useUserStore.getState();
      openAuth("signin");
      toast.info("Iniciá sesión para continuar.");
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch("/api/trip-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "xsed",
          level: travelType,
          originCountry,
          originCity,
          pax,
          startDate: toISODate(saturday),
          endDate: toISODate(sunday),
          nights: 1,
          status: "SAVED",
          ...(experienceId ? { experienceId } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          const { openAuth } = useUserStore.getState();
          openAuth("signin");
          toast.info("Iniciá sesión para continuar.");
        } else {
          toast.error(data.error ?? "No se pudo guardar. Intentá de nuevo.");
        }
        return;
      }
      trackCustomEvent({ event: "generate_lead", trip_type: "xsed" });
      router.push(`/${locale}/checkout?tripId=${data.tripRequest.id}`);
    } catch {
      toast.error("Error de conexión. Intentá de nuevo.");
    } finally {
      setIsSaving(false);
    }
  }, [originCity, originCountry, pax, travelType, locale, router, session, sessionStatus]);

  return (
    <div className="min-h-screen bg-ground" data-component="XsedBookClient">
      <XsedInternalHero
        content={{
          description: book.hero.description,
          backgroundImage: book.hero.fallbackImage,
          videoSrc: book.hero.videoSrc,
        }}
        hero={{
          title: book.hero.brand,
          label: book.hero.label,
          subtitle: book.hero.subtitle,
          fallbackImage: book.hero.fallbackImage,
        }}
        maxHeight="50vh"
      />

      <JourneyContentNavigation
        activeTab={activeTab}
        onTabChange={handleTabChange}
        tabs={book.contentTabs.map((tab) => ({ id: tab.id, label: tab.label }))}
        userBadgeLabels={userBadgeLabels}
      />

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row w-full gap-8">
          {/* Progress sidebar */}
          <div className="lg:sticky lg:top-8 lg:self-start hidden lg:block">
            <JourneyProgressSidebar
              activeTab={activeTab}
              addonsComingSoonLabel=""
              completedTabIds={completedTabIds}
              onStepClick={handleStepClick}
              progressLabel={book.hero.progressLabel}
              tabs={book.contentTabs}
            />
          </div>

          {/* Main form */}
          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <div className="flex-1">
              <Accordion
                collapsible
                onValueChange={setOpenSection}
                type="single"
                value={openSection}
              >
                <div className="space-y-4">
                  <JourneyDropdown
                    content={
                      originCountry && originCity
                        ? `${originCountry} · ${originCity}`
                        : originCountry ||
                          (detailsStepLabels?.originPlaceholder ??
                            "Elegí país y ciudad de salida")
                    }
                    label={detailsStepLabels?.originLabel ?? "Origen"}
                    value="origin"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex flex-col gap-2">
                        <label className="text-base font-bold text-gray-700">
                          {detailsStepLabels?.countryLabel ?? "País de salida"}
                        </label>
                        <CountrySelector
                          onChange={handleOriginCountryChange}
                          placeholder={
                            detailsStepLabels?.countryPlaceholder ??
                            "Escribir país de salida"
                          }
                          size="lg"
                          value={originCountry}
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-base font-bold text-gray-700">
                          {detailsStepLabels?.cityLabel ?? "Ciudad de salida"}
                        </label>
                        <CitySelector
                          countryCode={originCountryCode}
                          onChange={handleOriginCityChange}
                          placeholder={
                            detailsStepLabels?.cityPlaceholder ??
                            "Escribir ciudad de salida"
                          }
                          size="lg"
                          value={originCity}
                        />
                      </div>
                    </div>
                  </JourneyDropdown>

                  <JourneyDropdown
                    content={
                      travelTypeLabel
                        ? `${travelTypeLabel} · ${
                            pax === 1
                              ? book.pax.countOne.replace("{count}", String(pax))
                              : book.pax.countOther.replace("{count}", String(pax))
                          }`
                        : pax === 1
                          ? book.pax.countOne.replace("{count}", String(pax))
                          : book.pax.countOther.replace("{count}", String(pax))
                    }
                    label={book.pax.label}
                    value="pax"
                  >
                    <div className="flex flex-wrap items-start justify-start gap-6">
                      <div className="w-full max-w-32">
                        <FormField
                          disabled={travelType === "solo"}
                          id="xsed-pax"
                          label={book.pax.label}
                          min={1}
                          onChange={(e) =>
                            setPax(Math.max(1, Number(e.target.value) || 1))
                          }
                          type="number"
                          value={pax}
                        />
                      </div>

                      <div className="w-full max-w-56">
                        <FormSelectField
                          id="xsed-travel-type"
                          label={book.travelType.label}
                          onChange={(e) =>
                            handleTravelTypeChange(e.target.value as XsedTravelType)
                          }
                          value={travelType}
                        >
                          <option disabled value="">
                            {book.travelType.placeholder}
                          </option>
                          <option value="solo">{book.travelType.solo}</option>
                          <option value="couple">{book.travelType.couple}</option>
                          <option value="family">{book.travelType.family}</option>
                          <option value="group">{book.travelType.group}</option>
                        </FormSelectField>
                      </div>
                    </div>
                  </JourneyDropdown>
                </div>
              </Accordion>
              <JourneyActionBar
                canContinue={canContinue}
                isAllStepsComplete={isAllStepsComplete}
                isSavingAndRedirecting={isSaving}
                labels={book.actionBar}
                onClearAll={handleClearAll}
                onContinue={handleContinue}
                onGoToCheckout={handleBook}
                showClearAll={showClearAll}
              />
            </div>
          </div>

          {/* Order summary */}
          <XsedSummary
            onEdit={handleSummaryEdit}
            originCity={originCity}
            originCountry={originCountry}
            pax={pax}
            travelType={travelType}
            travelTypeLabel={travelTypeLabel}
          />
        </div>
      </div>
    </div>
  );
}
