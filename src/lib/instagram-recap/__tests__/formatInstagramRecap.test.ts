import { expect, it } from "vitest";
import type {
  InstagramPostStats,
  InstagramRecap,
} from "@/types/instagramRecap";
import { captionPreview, formatInstagramRecap } from "../formatInstagramRecap";

const post = (over: Partial<InstagramPostStats> = {}): InstagramPostStats => ({
  caption:
    "Esta vez fue Brasil 🇧🇷⁣\n⁣\nLugares que quizás nunca habrías buscado.",
  permalink: "https://www.instagram.com/p/DeKmNbpFQPC/",
  kind: "FEED",
  timestamp: "2026-10-07T15:00:00+0000",
  views: 722,
  reach: 500,
  saves: 3,
  shares: 2,
  likes: 4,
  comments: 1,
  ...over,
});

const base: InstagramRecap = {
  username: "getrandomtrip",
  current: { start: "2026-10-07", end: "2026-10-07", sinceSec: 0, untilSec: 0 },
  previous: {
    start: "2026-09-30",
    end: "2026-09-30",
    sinceSec: 0,
    untilSec: 0,
  },
  totals: {
    views: 600,
    reach: 300,
    accountsEngaged: 12,
    interactions: 30,
    profileViews: 40,
    linkTaps: 4,
  },
  previousTotals: {
    views: 500,
    reach: 300,
    accountsEngaged: 10,
    interactions: 0,
    profileViews: 20,
    linkTaps: 4,
  },
  followers: 156,
  followerDelta: { change: 2, since: "2026-10-07" },
  published: [post(), post({ kind: "REELS" })],
  topPost: post(),
};

const body = (r: InstagramRecap) => formatInstagramRecap(r).blocks[0].text.text;

it("renders the agreed layout", () => {
  expect(body(base)).toBe(
    [
      "📸 *Instagram @getrandomtrip* — Wed 7 Oct (vs Wed 30 Sep)",
      "Views 600 (+20%) · Reach 300 (+0%) · Engaged 12 (+20%) · Interactions 30 (new)",
      "Profile visits 40 (+100%) · Link taps 4 (+0%) — 10% of profile visits tapped the bio link",
      "👥 Followers 156 (+2 since Wed 7 Oct)",
      "📝 Published: 2 (1 post, 1 reel)",
      "🏆 Top of last 7 days: <https://www.instagram.com/p/DeKmNbpFQPC/|Esta vez fue Brasil 🇧🇷 Lugares que quizás nunca habrías bus…> — post · views 722 · reach 500 · likes 4 · comments 1 · saves 3 · shares 2",
      "⚠️ Instagram can take up to 48h to finalize these numbers",
    ].join("\n"),
  );
});

it("labels a multi-day Monday window", () => {
  const text = body({
    ...base,
    current: { ...base.current, start: "2026-10-09", end: "2026-10-11" },
    previous: { ...base.previous, start: "2026-10-02", end: "2026-10-04" },
  });
  expect(text).toContain("— Fri 9 Oct – Sun 11 Oct (vs Fri 2 Oct – Sun 4 Oct)");
});

it("handles a quiet first run without NaN", () => {
  const zero = {
    views: 0,
    reach: 0,
    accountsEngaged: 0,
    interactions: 0,
    profileViews: 0,
    linkTaps: 0,
  };
  const text = body({
    ...base,
    totals: zero,
    previousTotals: zero,
    followerDelta: null,
    published: [],
    topPost: null,
  });
  expect(text).not.toMatch(/NaN|Infinity/);
  expect(text).toContain("👥 Followers 156\n");
  expect(text).toContain("no profile visits");
  expect(text).toContain("📝 Published: nothing new");
  expect(text).toContain("🏆 Top of last 7 days: no posts");
});

it("escapes Slack control characters in captions", () => {
  const text = body({
    ...base,
    topPost: post({ caption: "<!channel> a|b & c" }),
  });
  expect(text).toContain("|&lt;!channel&gt; a¦b &amp; c>");
});

it("previews empty captions", () => {
  expect(captionPreview(" ⁣ ")).toBe("(no caption)");
});
