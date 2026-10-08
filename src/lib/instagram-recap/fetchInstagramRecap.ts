import type { InstagramRecap } from "@/types/instagramRecap";
import {
  getAccountTotals,
  getProfile,
  getRecentMedia,
} from "./instagramClient";
import { recordFollowers, type RecapBlobStore } from "./recapStore";
import { getRecapWindows } from "./recapWindow";

const TOP_POST_DAYS = 7;
const DAY_MS = 86_400_000;

export async function fetchInstagramRecap(
  token: string,
  store: RecapBlobStore,
  now: Date = new Date(),
): Promise<InstagramRecap> {
  const { current, previous } = getRecapWindows(now);
  const profile = await getProfile(token);
  const untilMs = current.untilSec * 1000;
  const [totals, previousTotals, media] = await Promise.all([
    getAccountTotals(token, profile.userId, current.sinceSec, current.untilSec),
    getAccountTotals(
      token,
      profile.userId,
      previous.sinceSec,
      previous.untilSec,
    ),
    getRecentMedia(token, profile.userId, untilMs - TOP_POST_DAYS * DAY_MS),
  ]);
  const today = new Date(now.getTime() - 3 * 3_600_000)
    .toISOString()
    .slice(0, 10);
  const snapshot = await recordFollowers(store, today, profile.followers);

  const inWindow = (ts: string) => {
    const ms = Date.parse(ts);
    return ms >= current.sinceSec * 1000 && ms < untilMs;
  };
  const beforeEnd = media.filter((m) => Date.parse(m.timestamp) < untilMs);
  const topPost =
    [...beforeEnd].sort((a, b) => b.views - a.views || b.reach - a.reach)[0] ??
    null;
  return {
    username: profile.username,
    current,
    previous,
    totals,
    previousTotals,
    followers: profile.followers,
    followerDelta: snapshot
      ? { change: profile.followers - snapshot.followers, since: snapshot.date }
      : null,
    published: media.filter((m) => inWindow(m.timestamp)),
    topPost,
  };
}
