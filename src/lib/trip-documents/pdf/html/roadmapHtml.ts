import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";
import type { ExperienceRoadmapDocument } from "@/lib/types/ExperienceRoadmap";
import type { XsedRoadmapDocument } from "@/lib/types/XsedRoadmap";
import { icon, type HtmlAssets } from "./htmlAssets";
import {
  date,
  escapeHtml as e,
  imageData,
  link,
  richText,
  summary,
} from "./htmlPrimitives";

export function roadmapHtml(
  document: ExperienceRoadmapDocument | XsedRoadmapDocument,
  assets: HtmlAssets,
) {
  const dictionary = document.locale === "en" ? en : es;
  const c = dictionary.pdfLayout;
  const { data, locale } = document;
  const experience = "heading" in data;
  const shortReference =
    !data.reservationReference ||
    (data.reservationReference.length < 60 &&
      !data.reservationReference.includes("\n"));
  const route = `${data.origin} → ${data.destination}`;
  let brand = icon(assets, "xsed-lockup", "brand-lockup");
  if ("heading" in data) {
    const traveler = data.travelerLabel;
    const label = data.experienceLabel;
    brand =
      traveler || label
        ? `<div class="experience-lockup">${traveler ? `<div>${locale === "es" ? icon(assets, "experience-get-lost-en", "experience-get-lost") : `<div class="experience-get-lost">${e(c.getLost)}</div>`}${traveler === "PAREJA" ? icon(assets, "experience-pareja-wordmark", "pareja") : `<p class="traveler">${e(traveler)}</p>`}</div>` : ""}${label ? `<div class="experience-divider">${e(c.experience)}\n${e(label)}</div>` : ""}</div>`
        : "";
  }
  let body = `<header class="header unit">${imageData(assets.logo, 203.2, 51, "logo")}<div class="header-right"><div class="status">${e(c.roadmap)}</div>${shortReference && data.reservationReference ? `<p class="reference">${e(c.refShort)} ${e(data.reservationReference)}</p>` : ""}<p class="route-small">${e(route)}</p>${brand}</div><h2 class="eyebrow">${e(c.itineraryEyebrow)}</h2><h1>${e("heading" in data ? data.heading : c.xsedTitle)}</h1><p class="subtitle">${e(c.routeSubtitle.replace("{origin}", data.origin).replace("{destination}", data.destination))}</p><p class="authored-label">${e(document.label)} · ${e(document.country)}</p></header>`;
  if (!shortReference)
    body += `<section class="unit reference-flow">${e(c.refShort)} ${e(data.reservationReference)}</section>`;
  if ("heading" in data) {
    const copy = dictionary.experienceRoadmapPdf;
    body += `<div class="unit row summary-row">${summary(copy.startDate, date(data.startDate, locale, true, false), c.departureDay)}${summary(copy.endDate, date(data.endDate, locale, true, false), c.arrivalDay)}${summary(c.travelTotal, data.duration)}</div>`;
  } else {
    body += `<div class="unit row summary-row">${summary(c.scheduledDate, date(data.departureDate, locale, true, false), c.departureDay)}${summary(dictionary.xsedRoadmapPdf.departureTime, data.departureTime, c.departureFrom.replace("{origin}", data.origin))}${summary(c.drivingTotal, data.drivingDuration)}</div>`;
  }
  body += `<h2 class="unit section-title itinerary-heading"><span class="tile">${icon(assets, "itinerary-car")}</span>${e(experience ? c.suggestedActivities : c.itinerary)}</h2>`;
  const items =
    "activities" in data
      ? data.activities.map((item) => ({
          ...item,
          description: item.description,
        }))
      : data.stops.map((item) => ({ ...item, description: item.directions }));
  body += items
    .map(
      (item, index) =>
        `<section class="unit itinerary-card card" data-step="${index + 1}" data-split><span class="number">${index + 1}</span><div class="item-header"><h3>${e(item.title)}</h3><span class="time">${e([experience && item.time ? c.suggestedTimes : "", item.date ? date(item.date, locale) : "", item.time].filter(Boolean).join("\n"))}</span></div><div class="rich split-content">${richText(item.description)}</div></section>`,
    )
    .join("");
  body += `<section class="unit map-panel card" data-anchor="1477"><span class="tile">${icon(assets, "itinerary-map-pin")}</span><h2>${e(c.mapTitle)}</h2><p>${e(data.mapUrl ? c.mapDescription : c.mapUnavailable)}</p>${data.mapUrl ? link(c.mapButton, data.mapUrl, "map-button") : ""}<span class="map-farewell">${e(c.farewell)} ✦</span></section>`;
  const footer = `<span class="footer-label">${e(c.roadmap)} · ${e(route)}</span><span class="pagination">${e(dictionary.hotelVoucherPdf.preview)} | <span class="page-number"></span></span>`;
  return {
    body,
    footer,
    className: experience ? "roadmap experience-roadmap" : "roadmap",
  };
}
