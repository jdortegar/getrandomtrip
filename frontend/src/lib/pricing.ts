
import { Filters } from "@/store/journeyStore";

export function parseBasePrice(displayPrice: string): number {
    const match = displayPrice.match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
}

export function computeFiltersCost(filters: Filters, pax: number): number {
    let selected = 0;
    if (filters.climate !== 'indistinto') selected++;
    if (filters.maxTravelTime !== 'sin-limite') selected++;
    if (filters.departPref !== 'indistinto') selected++;
    if (filters.arrivePref !== 'indistinto') selected++;
    if (filters.avoidDestinations.length > 0) selected++;

    if (selected <= 1) {
        return 0;
    } else if (selected >= 2 && selected <= 3) {
        return (selected - 1) * 18 * pax;
    } else {
        return (selected - 1) * 25 * pax;
    }
}
