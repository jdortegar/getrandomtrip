import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import Img from "@/components/common/Img";
import { TripperProfileSectionHeading } from "@/components/app/tripper-profile/TripperProfileSectionHeading";
import { TRIPPER_PROFILE_ANCHORS } from "@/components/app/tripper-profile/TripperProfileSubnav";
import { interpolateTemplate } from "@/lib/helpers/interpolateTemplate";
import { cn } from "@/lib/utils";
import type { TripperPublicProfileDict } from "@/lib/types/dictionary";
import type { TripperProfileStoryOption, TripperProfileStorySource } from "@/types/tripper";

interface TripperProfileStoriesProps {
  copy: TripperPublicProfileDict["stories"];
  /** Used in the editorial-fallback note ("while Nico prepares…"). */
  firstName: string;
  /** Byline for the Tripper's own stories. */
  name: string;
  source: TripperProfileStorySource;
  stories: TripperProfileStoryOption[];
}

/** Three featured stories; Randomtrip's editorial picks (with their own bylines) when the Tripper has none. */
export function TripperProfileStories({ copy, firstName, name, source, stories }: TripperProfileStoriesProps) {
  if (stories.length === 0) return null;
  const isEditorial = source === "editorial";

  return (
    <section
      aria-labelledby="tripper-stories-title"
      className="rt-container scroll-mt-32 py-12 md:py-16"
      data-component="TripperProfileStories"
      id={TRIPPER_PROFILE_ANCHORS.stories}
    >
      <TripperProfileSectionHeading
        aside={isEditorial ? interpolateTemplate(copy.editorialAside, { name: firstName }) : copy.aside}
        eyebrow={isEditorial ? copy.editorialEyebrow : copy.eyebrow}
        id="tripper-stories-title"
        title={isEditorial ? copy.editorialTitle : copy.title}
      />
      <ul className={cn("grid grid-cols-1 gap-12", "md:grid-cols-3 md:gap-6")}>
        {stories.map((story) => {
          const author = story.author ?? name;
          const meta = [story.category, story.minutes ? interpolateTemplate(copy.minutes, { minutes: String(story.minutes) }) : null]
            .filter(Boolean)
            .join(" · ");
          return (
            <li key={story.id}>
              <Link
                aria-label={`${copy.read}: ${story.title}`}
                className="group flex h-full flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4"
                href={story.href}
              >
                <span className="relative aspect-[8/5] overflow-hidden rounded-xl bg-gray-200">
                  <Img
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"
                    sizes="(min-width: 768px) 33vw, 100vw"
                    src={story.imageUrl}
                  />
                </span>
                <span className="mt-5 text-[10px] uppercase tracking-[0.18em] text-neutral-600">{meta}</span>
                <span className="mb-5 mt-3 max-w-[16rem] font-barlow-condensed text-[26px] font-bold leading-[1.1] tracking-[-0.025em] text-ink">
                  {story.title}
                </span>
                <span className="mt-auto flex items-center justify-between border-t border-gray-200 pt-3 text-xs text-neutral-600">
                  {interpolateTemplate(copy.byline, { author })}
                  <ArrowUpRight aria-hidden className="h-5 w-5 text-primary" />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
