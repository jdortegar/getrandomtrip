import { describe, expect, it } from "vitest";
import {
  buildEmptyTripperProfileDraft,
  canSubmitTripperProfile,
  getTripperProfileProgress,
  hasProfilePlace,
  isOverLimit,
  isValidMediaUrl,
  isValidProfileSlug,
  moveListItem,
  toProfileSlug,
  toggleAffinity,
} from "../tripperProfileEditor";
import { tripperProfileDraftFromExtras } from "../tripperProfileDraftFromExtras";
import type { TripperProfileDraft } from "@/types/tripper";

function completeDraft(): TripperProfileDraft {
  const draft = buildEmptyTripperProfileDraft();
  draft.identity = {
    ...draft.identity,
    city: "Mendoza",
    countryCode: "AR",
    headline: "Creo en los caminos secundarios.",
    name: "Nico Aranda",
    slug: "nico-aranda",
  };
  draft.bio = {
    affinities: ["backRoads"],
    body: "x".repeat(80),
    lead: "",
    more: "",
    title: "Soy de los que vuelven por otra calle.",
  };
  draft.travelerTypes.solo = { enabled: true, imageUrl: "", text: "Desconecta del ruido." };
  return draft;
}

function stepComplete(draft: TripperProfileDraft, id: string) {
  return getTripperProfileProgress(draft).find((step) => step.id === id)?.complete;
}

describe("tripper profile completion", () => {
  it("allows submitting once the three essential steps are complete", () => {
    expect(canSubmitTripperProfile(buildEmptyTripperProfileDraft())).toBe(false);
    expect(canSubmitTripperProfile(completeDraft())).toBe(true);
  });

  it("keeps atlas, media and stories optional", () => {
    const progress = getTripperProfileProgress(completeDraft());
    expect(progress.filter((step) => !step.essential).map((step) => step.complete)).toEqual([
      false,
      false,
      false,
    ]);
  });

  it("requires a cover description only when a cover is set", () => {
    const draft = completeDraft();
    draft.identity.coverUrl = "https://example.com/cover.jpg";
    expect(stepComplete(draft, "identity")).toBe(false);
    draft.identity.coverAlt = "Viñedos al atardecer";
    expect(stepComplete(draft, "identity")).toBe(true);
  });

  it("flags legacy text over the new limit instead of accepting it", () => {
    const draft = completeDraft();
    draft.identity.headline = "x".repeat(171);
    expect(stepComplete(draft, "identity")).toBe(false);
  });

  it("requires a bio of at least 80 characters and one affinity", () => {
    const draft = completeDraft();
    draft.bio.body = "x".repeat(79);
    expect(stepComplete(draft, "perspective")).toBe(false);
    draft.bio.body = "x".repeat(80);
    draft.bio.affinities = [];
    expect(stepComplete(draft, "perspective")).toBe(false);
  });

  it("requires an invitation text for every enabled traveler type", () => {
    const draft = completeDraft();
    draft.travelerTypes.group = { enabled: true, imageUrl: "", text: "" };
    expect(stepComplete(draft, "travelerTypes")).toBe(false);
  });
});

describe("tripper profile field helpers", () => {
  it("validates and builds slugs", () => {
    expect(isValidProfileSlug("nico-aranda")).toBe(true);
    expect(isValidProfileSlug("Nico Aranda")).toBe(false);
    expect(isValidProfileSlug("nico-")).toBe(false);
    expect(toProfileSlug("  Nicolás Aranda!! ")).toBe("nicolas-aranda");
  });

  it("detects values over a limit", () => {
    expect(isOverLimit("abc", 3)).toBe(false);
    expect(isOverLimit("abcd", 3)).toBe(true);
  });

  it("accepts only public post URLs per provider", () => {
    expect(isValidMediaUrl("youtube", "https://www.youtube.com/watch?v=LXb3EKWsInQ")).toBe(true);
    expect(isValidMediaUrl("youtube", "https://youtu.be/LXb3EKWsInQ")).toBe(true);
    expect(isValidMediaUrl("instagram", "https://www.instagram.com/p/DXiYOKaFxwb/")).toBe(true);
    expect(isValidMediaUrl("instagram", "https://www.instagram.com/getrandomtrip.es/")).toBe(false);
    expect(
      isValidMediaUrl("tiktok", "https://www.tiktok.com/@scout2015/video/6718335390845095173"),
    ).toBe(true);
    expect(isValidMediaUrl("tiktok", "https://vm.tiktok.com/ZMabc/")).toBe(false);
  });

  it("moves list items without mutating and ignores out-of-range moves", () => {
    const list = ["a", "b", "c"];
    expect(moveListItem(list, 0, 1)).toEqual(["b", "a", "c"]);
    expect(moveListItem(list, 0, -1)).toBe(list);
    expect(list).toEqual(["a", "b", "c"]);
  });

  it("caps affinities at three and toggles off", () => {
    const three = toggleAffinity(
      toggleAffinity(toggleAffinity([], "backRoads"), "cityLife"),
      "seaCoast",
    );
    expect(toggleAffinity(three, "slowTravel")).toEqual(three);
    expect(toggleAffinity(three, "cityLife")).toEqual(["backRoads", "seaCoast"]);
  });

  it("matches places by country and city, case-insensitively", () => {
    const places = [{ city: "Mendoza", countryCode: "AR", id: "1", isLocalExpert: true }];
    expect(hasProfilePlace(places, "AR", "mendoza ")).toBe(true);
    expect(hasProfilePlace(places, "AR", undefined)).toBe(false);
  });
});

describe("tripperProfileDraftFromExtras", () => {
  it("seeds the draft from the current settings fields", () => {
    const draft = tripperProfileDraftFromExtras({
      avatarUrl: "https://example.com/me.jpg",
      extras: {
        availableTypes: ["solo", "family"],
        bio: "Vivo en Mendoza.",
        destinations: ["Argentina", "chile", "Argentina", "Atlantis"],
        heroImage: "https://example.com/hero.jpg",
        location: "Mendoza",
        nickname: "Nico",
        socialLinks: [{ handle: "https://linkedin.com/in/nico", network: "linkedin" }],
        tripperSlug: "nico",
      },
      name: "Nicolás Aranda",
    });
    expect(draft.identity).toMatchObject({
      city: "Mendoza",
      coverUrl: "https://example.com/hero.jpg",
      name: "Nico",
      portraitUrl: "https://example.com/me.jpg",
      slug: "nico",
    });
    expect(draft.bio.body).toBe("Vivo en Mendoza.");
    expect(draft.places.map((place) => place.countryCode)).toEqual(["AR", "CL"]);
    expect(draft.travelerTypes.solo.enabled).toBe(true);
    expect(draft.travelerTypes.couple.enabled).toBe(false);
    expect(draft.media.linkedinUrl).toBe("https://linkedin.com/in/nico");
  });

  it("falls back to the account name when there are no tripper fields", () => {
    const draft = tripperProfileDraftFromExtras({ extras: null, name: "Ana" });
    expect(draft.identity.name).toBe("Ana");
  });
});
