import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";
import type { HotelVoucherDocument } from "@/lib/types/HotelVoucher";
import type { DinnerVoucherDocument } from "@/lib/types/DinnerVoucher";
import type { ActivityVoucherDocument } from "@/lib/types/ActivityVoucher";
import { icon, type HtmlAssets } from "./htmlAssets";
import {
  date,
  escapeHtml as e,
  imageData,
  numberedItems,
  summary,
} from "./htmlPrimitives";
import {
  details,
  policy,
  qrPanel,
  serviceGrid,
  type DetailRow,
} from "./voucherParts";

export function voucherHtml(
  document:
    | HotelVoucherDocument
    | DinnerVoucherDocument
    | ActivityVoucherDocument,
  assets: HtmlAssets,
  images: Record<string, Buffer>,
) {
  const dictionary = document.locale === "en" ? en : es;
  const c = dictionary.pdfLayout;
  const common = dictionary.hotelVoucherPdf;
  const { data, locale } = document;
  const hotel = document.template === "hotel-voucher";
  const dinner = document.template === "dinner-voucher";
  const activity = document.template === "activity-voucher";
  const provider =
    "property" in data
      ? data.property
      : "restaurant" in data
        ? data.restaurant
        : data.provider;
  const shortReference =
    !data.reservationReference ||
    (data.reservationReference.length < 70 &&
      !data.reservationReference.includes("\n"));
  const shortStatus =
    !data.supplierConfirmation ||
    (data.supplierConfirmation.length < 70 &&
      !data.supplierConfirmation.includes("\n"));
  let body = `<header class="header unit">${imageData(assets.logo, 203.2, 51, "logo")}<div class="header-right">${icon(assets, hotel ? "voucher-hotel-bed" : dinner ? "voucher-dinner-cloche" : "voucher-experience-icon", "header-icon")}<div class="status">${e(shortStatus ? data.supplierConfirmation || c.voucher : c.voucher)}</div>${shortReference && data.reservationReference ? `<p class="reference">${e(c.refShort)} ${e(data.reservationReference)}</p>` : ""}</div><h2 class="eyebrow">${e(hotel ? c.hotelTitle : dinner ? c.dinnerTitle : c.activityTitle)}</h2><h1>${e(provider.name)}</h1><p class="subtitle">${e(provider.locality || document.country)}</p><p class="authored-label">${e(document.label)}</p></header>`;
  if (!shortStatus)
    body += `<section class="unit flow-warning">${e(data.supplierConfirmation)}</section>`;
  if (!shortReference)
    body += `<section class="unit reference-flow">${e(c.refShort)} ${e(data.reservationReference)}</section>`;
  const rows: DetailRow[] = [{ label: c.holderShort, value: data.holder }];
  if ("property" in data) {
    const nights = Math.round(
      (Date.parse(data.checkOutDate) - Date.parse(data.checkInDate)) / 86400000,
    );
    rows.push(
      { label: common.guests, value: data.guests },
      {
        label: c.duration,
        value:
          nights === 1
            ? c.singleNight
            : c.manyNights.replace("{count}", String(nights)),
      },
    );
    body += `<div class="unit row summary-row">${summary(c.checkIn, date(data.checkInDate, locale, true), data.checkInTime ? c.fromTime.replace("{time}", data.checkInTime) : "")}${icon(assets, "voucher-arrow", "summary-arrow")}${summary(c.checkOut, date(data.checkOutDate, locale, true), data.checkOutTime ? c.untilTime.replace("{time}", data.checkOutTime) : "")}</div>`;
  } else {
    rows.push(
      {
        label: dinner ? dictionary.dinnerVoucherPdf.guests : c.accessShort,
        value: "guests" in data ? data.guests : data.participants,
      },
      {
        label: dinner ? dictionary.dinnerVoucherPdf.service : c.programShort,
        value: data.service,
      },
    );
    body += `<div class="unit row summary-row">${summary(dinner ? c.dinnerDate : c.activityDate, date(data.date, locale, true), dinner ? data.service : "")}${summary(dinner ? c.dinnerTime : c.activityTime, [data.time, "endTime" in data ? data.endTime : ""].filter(Boolean).join(" - "), activity ? data.service : dictionary.dinnerVoucherPdf.time)}</div>`;
  }
  rows.push(
    { label: common.payment, value: data.paymentWording, payment: true },
    {
      label: c.issuedShort,
      value: data.issueDate ? date(data.issueDate, locale) : undefined,
    },
  );
  const contact: DetailRow[] = [];
  if (!hotel)
    contact.push({
      label: dinner ? c.restaurantShort : c.establishment,
      value: provider.name,
    });
  else contact.push({ label: c.destinationShort, value: provider.locality });
  contact.push({
    label: hotel ? common.address : c.locationShort,
    value:
      provider.locationUrl && !activity
        ? `${common.location.toUpperCase()}  |  ${provider.address}`
        : provider.address,
    url: provider.locationUrl,
  });
  if (!hotel)
    contact.push({ label: common.locality, value: provider.locality });
  contact.push(
    {
      label: provider.region ? c.regionShort : common.country,
      value: provider.region || document.country,
    },
    { label: dinner ? c.phoneShort : c.contactShort, value: provider.contact },
    { label: common.email, value: provider.email },
  );
  body += `<div class="unit row details-row" data-columns>${details(c.reservationDetails, rows, assets, "voucher-calendar-check")}${details(c.locationContact, contact, assets, "voucher-location-generic")}</div>`;
  const qr = qrPanel(
    data,
    provider,
    c,
    images,
    hotel ? c.hotelQrHint : dinner ? c.dinnerQrHint : c.activityQrHint,
  );
  if ("property" in data) {
    body += serviceGrid(data.inclusions, c.services, assets);
    if (data.localActivities || qr)
      body += `<div class="unit row local-qr" data-columns>${
        data.localActivities
          ? `<section class="local card" data-split><h2 class="section-title spacer">${e(c.localActivities)}</h2><div class="split-content">${data.localActivities
              .split("\n")
              .map(
                (line) =>
                  `<div class="local-row chunk">${icon(assets, "voucher-check-circle")}<p>${e(line)}</p></div>`,
              )
              .join("")}</div></section>`
          : ""
      }${qr}</div>`;
    body += policy(
      c.hotelInformation,
      data.instructions &&
        (data.instructions.includes("\n") || data.instructions.length > 300)
        ? [c.hotelGuidance, c.hotelArrival, c.hotelRules, data.instructions]
        : [
            c.hotelGuidance,
            [c.hotelArrival, data.instructions].filter(Boolean).join(" "),
            c.hotelRules,
          ],
      "unit dark hotel-policy",
    );
  } else if ("restaurant" in data) {
    if (data.menuItems.length || qr)
      body += `<div class="unit row menu-row" data-columns>${data.menuItems.length ? `<section class="menu card" data-split><h2 class="section-title spacer">${e(c.menuTitle)}</h2><div class="split-content">${numberedItems(data.menuItems)}</div></section>` : ""}${qr}</div>`;
    body += `<section class="unit policy card dark dinner-presentation" data-split><h2 class="section-title">${icon(assets, "voucher-dinner-alert")}${e(c.dinnerPresentation)}</h2><p>${e(c.dinnerGuidance)}</p></section>`;
    body += policy(
      c.terms,
      [data.conditions || c.dinnerTerms],
      "unit dinner-terms",
    );
  } else {
    body += serviceGrid(
      data.program,
      data.inclusions?.length
        ? dictionary.activityVoucherPdf.program
        : c.services,
      assets,
      true,
    );
    if (data.inclusions?.length)
      body += serviceGrid(data.inclusions, c.services, assets, true);
    body += `<section class="unit card activity-presentation">${icon(assets, "voucher-alert-triangle-circle")}<div><h2>${e(c.presentation)}</h2><p>${e(c.activityGuidance)}</p></div></section>`;
    body += `<div class="unit row activity-bottom" data-columns>${policy(c.information, [data.recommendations || c.activityTerms], "dark", assets, "voucher-information-circle")}${qr}</div>`;
  }
  const footer = `<span class="footer-label">${e(provider.name)} · ${e(provider.locality || document.country)}</span>${!hotel ? `<div class="farewell">${e(dinner ? c.dinnerFarewell : c.activityFarewell)}</div>` : ""}<span class="pagination">${e(common.preview)} | <span class="page-number"></span></span>`;
  return {
    body,
    footer,
    className: hotel ? "hotel" : dinner ? "dinner" : "activity",
  };
}
