import type { Config } from "@netlify/functions";
import { dispatchSocialWorker } from "../../src/lib/social-approvals/dispatchSocialWorker";
// Recovery only. Human feedback dispatches immediately; no Instagram polling.
export const config: Config = { schedule: "*/5 * * * *" };
export default async function handler() {
  await dispatchSocialWorker();
}
