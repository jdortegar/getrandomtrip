import { TripperProfileAbout } from "@/components/app/tripper-profile/TripperProfileAbout";
import { TripperProfileAtlas } from "@/components/app/tripper-profile/TripperProfileAtlas";
import { TripperProfileClosing } from "@/components/app/tripper-profile/TripperProfileClosing";
import { TripperProfileExpertiseStrip } from "@/components/app/tripper-profile/TripperProfileExpertiseStrip";
import { TripperProfileFaq } from "@/components/app/tripper-profile/TripperProfileFaq";
import { TripperProfileGalleryCarousel } from "@/components/app/tripper-profile/TripperProfileGalleryCarousel";
import { TripperProfileHero } from "@/components/app/tripper-profile/TripperProfileHero";
import { TripperProfileJourneyCards } from "@/components/app/tripper-profile/TripperProfileJourneyCards";
import { TripperProfileMobileCta } from "@/components/app/tripper-profile/TripperProfileMobileCta";
import { TripperProfileMediaCarousel } from "@/components/app/tripper-profile/TripperProfileMediaCarousel";
import { TripperProfileStories } from "@/components/app/tripper-profile/TripperProfileStories";
import { TripperProfileSubnav } from "@/components/app/tripper-profile/TripperProfileSubnav";
import { getEnabledTravelerTypes, resolveProfileStories } from "@/lib/helpers/tripperPublicProfile";
import type { TripperProfileEditorDict, TripperPublicProfileDict } from "@/lib/types/dictionary";
import type { TripperProfileDraft, TripperProfileStoryOption, TripperProfileTravelerType } from "@/types/tripper";

interface TripperPublicProfileProps {
  /** Labels shared with the editor: traveler-type names and affinity names. */
  catalogCopy: {
    affinityLabels: TripperProfileEditorDict["perspective"]["affinityOptions"];
    typeCopy: TripperProfileEditorDict["travelerTypes"]["types"];
  };
  collectionNumber?: string;
  copy: TripperPublicProfileDict;
  draft: TripperProfileDraft;
  /** Randomtrip editorial picks shown when the Tripper features no stories. */
  editorialStories: TripperProfileStoryOption[];
  journeyHrefs: Record<TripperProfileTravelerType, string>;
  locale: string;
  /** The Tripper's own published stories (featured ones are picked by id). */
  stories: TripperProfileStoryOption[];
}

/** The public Tripper profile, assembled from a profile draft (published copy or preview). */
export function TripperPublicProfile({
  catalogCopy,
  collectionNumber,
  copy,
  draft,
  editorialStories,
  journeyHrefs,
  locale,
  stories,
}: TripperPublicProfileProps) {
  const { identity } = draft;
  const firstName = identity.name.trim().split(/\s+/)[0] ?? identity.name;
  const types = getEnabledTravelerTypes(draft);
  const featured = resolveProfileStories(draft.featuredStoryIds, stories, editorialStories);
  const storyHrefs = Object.fromEntries(stories.map((story) => [story.id, story.href]));

  return (
    <div className="bg-ground text-ink" data-component="TripperPublicProfile">
      <TripperProfileSubnav copy={copy.subnav} firstName={firstName} />
      <TripperProfileHero
        collectionNumber={collectionNumber}
        copy={copy.hero}
        identity={identity}
        locale={locale}
        payoff={copy.closing.payoff}
      />
      <TripperProfileExpertiseStrip
        copy={copy.strip}
        firstName={firstName}
        typeLabels={types.map((type) => catalogCopy.typeCopy[type].label)}
      />
      {types.length > 0 ? (
        <TripperProfileJourneyCards
          copy={copy.journeys}
          hrefs={journeyHrefs}
          travelerTypes={draft.travelerTypes}
          typeCopy={catalogCopy.typeCopy}
          types={types}
        />
      ) : null}
      <TripperProfileAbout
        affinityLabels={catalogCopy.affinityLabels}
        bio={draft.bio}
        collectionNumber={collectionNumber}
        copy={copy.about}
        name={identity.name}
        portraitUrl={identity.portraitUrl}
      />
      <TripperProfileMediaCarousel carouselCopy={copy.carousel} copy={copy.media} items={draft.media.items} />
      <TripperProfileGalleryCarousel carouselCopy={copy.carousel} copy={copy.gallery} items={draft.media.gallery} name={firstName} />
      {draft.places.length > 0 ? (
        <TripperProfileAtlas copy={copy.atlas} firstName={firstName} locale={locale} places={draft.places} storyHrefs={storyHrefs} />
      ) : null}
      <TripperProfileStories copy={copy.stories} firstName={firstName} name={identity.name} source={featured.source} stories={featured.stories} />
      <TripperProfileFaq copy={copy.faq} />
      <TripperProfileClosing copy={copy.closing} firstName={firstName} />
      <TripperProfileMobileCta copy={copy.mobileCta} firstName={firstName} />
      <div aria-hidden className="h-16 md:hidden" />
    </div>
  );
}
