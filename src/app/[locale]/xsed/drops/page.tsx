import { hasLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { getPublicDropEntries, getCurrentXsedDrop } from "@/lib/data/xsed";
import { XSED_TESTIMONIALS } from "@/lib/data/xsed-testimonials";
import { AllDropsGrid } from "@/components/app/xsed/AllDropsGrid";
import { XsedInternalHero } from "@/components/app/xsed/XsedInternalHero";
import { CountDown } from "@/components/app/xsed/CountDown";
import Testimonials from "@/components/Testimonials/Testimonials";

type LocaleParams = { params: Promise<{ locale?: string | string[] }> };

export default async function XsedDropsPage(props: LocaleParams) {
  const params = await props.params;
  const raw = params?.locale;
  const locale = typeof raw === "string" ? raw : raw?.[0];
  const normalizedLocale = hasLocale(locale) ? locale : "es";
  const dict = await getDictionary(normalizedLocale);

  const currentDrop = await getCurrentXsedDrop();
  const { drops, hasMore } = await getPublicDropEntries(
    normalizedLocale,
    0,
    6,
    currentDrop?.id,
  );

  return (
    <>
      <XsedInternalHero
        content={{}}
        dropsPage={dict.xsedDropsPage}
        hero={dict.xsedPage.hero}
      />
      <AllDropsGrid excludeId={currentDrop?.id} initialDrops={drops} initialHasMore={hasMore} />
      {currentDrop ? (
        <CountDown
          locale={normalizedLocale}
          number={currentDrop.number}
          soldCount={currentDrop.soldCount}
          targetDate={currentDrop.targetDate}
          totalSlots={currentDrop.totalSlots}
          useForm={true}
        />
      ) : null}
      <Testimonials featureColor="#D97E4A" testimonials={XSED_TESTIMONIALS} />
    </>
  );
}
