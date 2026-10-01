import { getAllTrippers } from "@/lib/db/tripper-queries";
import { showTripperDiscovery } from "@/lib/deployment";

/** Public tripper list for discovery surfaces; skips the query while discovery is hidden. */
export function getDiscoverableTrippers() {
  return showTripperDiscovery() ? getAllTrippers() : Promise.resolve([]);
}
