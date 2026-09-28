/** Public product families only: never send authored trip names or booking IDs. */
const PRODUCTS: Record<string, string> = {
  couple: "Couple trip",
  solo: "Solo trip",
  family: "Family trip",
  group: "Group trip",
  honeymoon: "Honeymoon trip",
  paws: "Pet-friendly trip",
  xsed: "XSED trip",
};

export interface AnalyticsItem {
  item_id: string;
  item_name: string;
  item_category: string;
  quantity: number;
  price?: number;
}

export interface CommerceValue {
  value: number;
  currency: string;
  items: AnalyticsItem[];
}

export function bookingItems(
  tripType: string,
  price?: number,
): AnalyticsItem[] {
  if (!Object.hasOwn(PRODUCTS, tripType)) return [];
  return [
    {
      item_id: `trip-${tripType}`,
      item_name: PRODUCTS[tripType],
      item_category: tripType,
      // A single item is the whole booking, not a passenger or a destination.
      quantity: 1,
      ...(price === undefined ? {} : { price }),
    },
  ];
}

export function bookingValue(
  tripType: string,
  value: number,
  currency = "USD",
): CommerceValue {
  return { value, currency, items: bookingItems(tripType, value) };
}

export function sanitizeCommerce(
  data: Record<string, unknown>,
): Record<string, unknown> | null {
  const { event, items } = data;
  const monetary = ["begin_checkout", "add_payment_info", "purchase"].includes(
    String(event),
  );
  if (!monetary && event !== "view_item" && event !== "select_item")
    return null;
  if (!Array.isArray(items) || items.length !== 1) return null;
  const item = items[0];
  if (!item || typeof item.item_id !== "string" || item.quantity !== 1)
    return null;
  const safeItems = bookingItems(item.item_id.replace(/^trip-/, ""));
  if (!safeItems.length || safeItems[0].item_id !== item.item_id) return null;
  if (!monetary) return { event, items: safeItems };
  // Active Stripe checkout is USD; legacy recorded payments can be ARS.
  if (
    !["USD", "ARS"].includes(String(data.currency)) ||
    typeof data.value !== "number" ||
    !Number.isFinite(data.value) ||
    data.value < 0 ||
    data.value > 1_000_000_000 ||
    item.price !== data.value
  )
    return null;
  if (
    event === "purchase" &&
    !/^pi_[a-zA-Z0-9]{1,200}$/.test(String(data.transaction_id))
  )
    return null;
  if (event === "add_payment_info" && data.payment_type !== "stripe")
    return null;
  return {
    event,
    value: data.value,
    currency: data.currency,
    items: [{ ...safeItems[0], price: data.value }],
    ...(event === "purchase" ? { transaction_id: data.transaction_id } : {}),
    ...(event === "add_payment_info" ? { payment_type: "stripe" } : {}),
  };
}
