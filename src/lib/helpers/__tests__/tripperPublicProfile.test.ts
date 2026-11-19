import { describe, expect, it } from "vitest";
import {
  getMediaEmbedUrl,
  getVisibleMediaItems,
  groupPlacesByCountry,
  projectToWorldMap,
  resolveProfileStories,
} from "../tripperPublicProfile";
import type { TripperProfileMediaItem, TripperProfileStoryOption } from "@/types/tripper";

function story(id: string): TripperProfileStoryOption {
  return { category: "c", href: `/blog/${id}`, id, imageUrl: "/x.jpg", title: id };
}

describe("getMediaEmbedUrl", () => {
  it("builds privacy-friendly YouTube embeds from watch, short and shorts links", () => {
    const expected = "https://www.youtube-nocookie.com/embed/LXb3EKWsInQ?autoplay=1&rel=0";
    expect(getMediaEmbedUrl({ provider: "youtube", url: "https://www.youtube.com/watch?v=LXb3EKWsInQ" })).toBe(expected);
    expect(getMediaEmbedUrl({ provider: "youtube", url: "https://youtu.be/LXb3EKWsInQ" })).toBe(expected);
    expect(getMediaEmbedUrl({ provider: "youtube", url: "https://youtube.com/shorts/LXb3EKWsInQ" })).toBe(expected);
  });

  it("embeds Instagram posts and reels but not profiles", () => {
    expect(getMediaEmbedUrl({ provider: "instagram", url: "https://www.instagram.com/p/DXiYOKaFxwb/" })).toBe(
      "https://www.instagram.com/p/DXiYOKaFxwb/embed",
    );
    expect(getMediaEmbedUrl({ provider: "instagram", url: "https://www.instagram.com/reel/abc123/" })).toBe(
      "https://www.instagram.com/reel/abc123/embed",
    );
    expect(getMediaEmbedUrl({ provider: "instagram", url: "https://www.instagram.com/getrandomtrip.es/" })).toBeNull();
  });

  it("embeds TikTok videos by id and leaves uploads to a native player", () => {
    expect(
      getMediaEmbedUrl({ provider: "tiktok", url: "https://www.tiktok.com/@scout2015/video/6718335390845095173" }),
    ).toBe("https://www.tiktok.com/embed/v2/6718335390845095173");
    expect(getMediaEmbedUrl({ provider: "upload", url: "blob:x" })).toBeNull();
  });
});

describe("getVisibleMediaItems", () => {
  it("drops hidden items and items without a link", () => {
    const base: TripperProfileMediaItem = { id: "a", isVisible: true, posterUrl: "", provider: "youtube", title: "", url: "u" };
    const items = [base, { ...base, id: "b", isVisible: false }, { ...base, id: "c", url: " " }];
    expect(getVisibleMediaItems(items).map((item) => item.id)).toEqual(["a"]);
  });
});

describe("resolveProfileStories", () => {
  const stories = [story("a"), story("b"), story("c"), story("d")];
  const editorial = [story("e1"), story("e2"), story("e3"), story("e4")];

  it("keeps the Tripper's featured order, ignoring removed posts", () => {
    expect(resolveProfileStories(["c", "gone", "a"], stories, editorial)).toEqual({
      source: "tripper",
      stories: [story("c"), story("a")],
    });
  });

  it("falls back to three editorial stories when nothing is featured", () => {
    const result = resolveProfileStories([], stories, editorial);
    expect(result.source).toBe("editorial");
    expect(result.stories.map((s) => s.id)).toEqual(["e1", "e2", "e3"]);
  });
});

describe("groupPlacesByCountry", () => {
  it("groups in first-seen order", () => {
    const groups = groupPlacesByCountry([
      { countryCode: "AR", id: "1", isLocalExpert: true },
      { countryCode: "CL", id: "2", isLocalExpert: false },
      { countryCode: "AR", id: "3", isLocalExpert: false },
    ]);
    expect(groups.map((group) => [group.countryCode, group.places.length])).toEqual([["AR", 2], ["CL", 1]]);
  });
});

describe("projectToWorldMap", () => {
  it("maps the map corners and Mendoza onto the 1000×500 SVG", () => {
    expect(projectToWorldMap({ lat: 85, lng: -180 })).toEqual({ x: 0, y: 0 });
    expect(projectToWorldMap({ lat: -60, lng: 180 })).toEqual({ x: 1000, y: 500 });
    const mendoza = projectToWorldMap({ lat: -32.89, lng: -68.84 });
    expect(mendoza.x).toBeCloseTo(308.8, 1);
    expect(mendoza.y).toBeCloseTo(406.5, 1);
  });
});
