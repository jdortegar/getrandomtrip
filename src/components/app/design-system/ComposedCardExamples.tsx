"use client";

import { TripperCarouselCard } from "@/components/app/about-us/TripperCarouselCard";
import { UsageExample } from "@/components/app/design-system/UsageExample";
import { DropCard } from "@/components/app/xsed/DropCard";
import BlogCard from "@/components/BlogCard";
import { ExperienceCard } from "@/components/by-type/shared/ExperienceCard";
import TravelerTypeCard from "@/components/TravelerTypeCard";
import TripperCard from "@/components/TripperCard";
import { useLocale } from "@/hooks/useDictionary";
import { BRAND_BOOK_PHOTOS } from "@/lib/constants/BRAND_BOOK_PHOTOS";
import type { DesignSystemDict } from "@/lib/types/dictionary";
import { getPlannerContentForType } from "@/lib/utils/experiencesData";

interface ComposedCardExamplesProps {
  copy: DesignSystemDict;
}

/** Same Figma slot TypePlanner uses for ExperienceCard. */
const CARD_SLOT = "max-w-full min-w-0 w-[300px]";
const CARD_CAPTION = "font-semibold leading-7 mb-3 text-xl";

export function ComposedCardExamples({ copy }: ComposedCardExamplesProps) {
  const labels = copy.cards;
  const locale = useLocale();
  const level = getPlannerContentForType("solo", locale).levels.find(
    (item) => item.card,
  );

  return (
    <>
      <div className="flex flex-col gap-12">
        {level ? (
          <div className={CARD_SLOT}>
            <p className={CARD_CAPTION}>{labels.experience}</p>
            <ExperienceCard href="#cards" level={level} travelerType="solo" />
          </div>
        ) : null}
        <div className="flex flex-wrap gap-x-8 gap-y-12 items-start">
          <div className={CARD_SLOT}>
            <p className={CARD_CAPTION}>{labels.tripper}</p>
            <TripperCard
              href="lucia"
              imageUrl={BRAND_BOOK_PHOTOS.lucia}
              name={labels.tripperName}
            />
          </div>
          <div className={CARD_SLOT}>
            <p className={CARD_CAPTION}>{labels.travelerType}</p>
            <TravelerTypeCard
              className="aspect-3/4"
              description={labels.body}
              fill
              href="#cards"
              imageUrl={BRAND_BOOK_PHOTOS.beachHat}
              title={labels.travelerTypeTitle}
            />
          </div>
          <div className={CARD_SLOT}>
            <p className={CARD_CAPTION}>{labels.tripperCarousel}</p>
            <TripperCarouselCard
              avatarUrl={BRAND_BOOK_PHOTOS.lucia}
              bio={labels.body}
              name={labels.tripperName}
              tripperSlug="lucia"
            />
          </div>
          <div className={CARD_SLOT}>
            <p className={CARD_CAPTION}>{labels.blog}</p>
            <BlogCard
              post={{
                category: labels.blogCategory,
                href: "#cards",
                image: BRAND_BOOK_PHOTOS.lunchTable,
                title: labels.blogTitle,
              }}
            />
          </div>
          <div className={CARD_SLOT}>
            <p className={CARD_CAPTION}>{labels.drop}</p>
            <DropCard
              drop={{
                date: "",
                image: BRAND_BOOK_PHOTOS.sunsetSwim,
                label: labels.dropLabel,
                number: 1,
                slug: "gallery-drop",
                title: labels.dropTitle,
              }}
            />
          </div>
        </div>
      </div>
      <UsageExample
        code={`<ExperienceCard href={href} level={level} travelerType="solo" />
<TripperCard href={slug} imageUrl={photo} name={copy.name} />
<TravelerTypeCard className="aspect-3/4" fill href={href} imageUrl={photo} title={copy.title} />`}
        label={copy.usage}
      />
    </>
  );
}
