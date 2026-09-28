import { pathWithoutLocale } from "@/lib/i18n/pathForLocale";
import { canonicalUrl, isIndexablePath } from "@/lib/seo/urls";
import { sanitizeCommerce } from "./commerce";

export interface AnalyticsPage {
  language: "es" | "en";
  page_location: string;
  page_path: string;
  page_referrer: string;
  page_title: string;
  purchaseOnly: boolean;
  commerceOnly?: boolean;
}

const TITLES: Record<string, string> = {
  "/": "Home",
  "/about-us": "About",
  "/blog": "Blog",
  "/contact": "Contact",
  "/cookies": "Cookies",
  "/experiences": "Experiences",
  "/faq": "FAQ",
  "/privacy": "Privacy",
  "/refund": "Refunds",
  "/terms": "Terms",
  "/trippers": "Trippers",
  "/xsed": "XSED",
  "/xsed/drops": "XSED drops",
  "/journey": "Journey",
  "/xsed/book": "XSED booking",
  "/checkout/success": "Purchase confirmation",
  "/checkout": "Checkout",
};

export function analyticsPage(pathname: string): AnalyticsPage | null {
  const clean = pathname.split(/[?#]/)[0];
  const language = /^\/en(?:\/|$)/.test(clean) ? "en" : "es";
  let path = pathWithoutLocale(clean).replace(/\/+$/, "") || "/";
  const purchaseOnly = path === "/checkout/success";
  const commerceOnly = path === "/checkout";
  if (
    !isIndexablePath(path) &&
    !["/journey", "/xsed/book"].includes(path) &&
    !purchaseOnly &&
    !commerceOnly
  )
    return null;
  let title = TITLES[path];
  if (/^\/blog\//.test(path)) {
    path = "/blog/article";
    title = "Blog article";
  }
  if (/^\/trippers\//.test(path)) {
    path = "/trippers/profile";
    title = "Tripper profile";
  }
  if (/^\/experiences\/by-tripper\//.test(path)) {
    path = "/experiences/by-tripper/profile";
    title = "Tripper experiences";
  }
  if (/^\/experiences\/by-type\//.test(path))
    title = "Experiences by traveler type";
  const page_location = canonicalUrl(language, path);
  return {
    language,
    page_location,
    page_path: new URL(page_location).pathname,
    page_referrer: "",
    page_title: title,
    purchaseOnly,
    ...(commerceOnly ? { commerceOnly: true } : {}),
  };
}

const TRIP_TYPES = [
  "couple",
  "solo",
  "family",
  "group",
  "honeymoon",
  "paws",
  "xsed",
];

/** Never spread caller data: arbitrary keys and values can contain personal data. */
export function sanitizeEvent(
  data: Record<string, unknown>,
): Record<string, unknown> | null {
  const { event } = data;
  if (
    event === "page_view" ||
    event === "newsletter_subscribe" ||
    event === "waitlist_join"
  )
    return { event };
  if (
    (event === "sign_up" || event === "login") &&
    ["email", "google"].includes(String(data.method))
  )
    return { event, method: data.method };
  if (
    event === "scroll_depth" &&
    [25, 50, 75, 90, 100].includes(Number(data.percent))
  )
    return { event, percent: Number(data.percent) };
  if (event === "generate_lead" && TRIP_TYPES.includes(String(data.trip_type)))
    return { event, trip_type: data.trip_type };
  return sanitizeCommerce(data);
}
