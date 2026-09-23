import { render } from "@react-email/components";
import { afterAll, beforeAll, expect, it } from "vitest";
import { Window, type Document as EmailDocument } from "happy-dom";
import NewsletterGoLive from "../NewsletterGoLive";
import TripStartVouchers from "../TripStartVouchers";
import XsedCampaign from "../XsedCampaign";
import WelcomeEmail from "../WelcomeEmail";

const orders = {
  newsletter: [
    "Nothing You Could Do:400",
    "Barlow Condensed:700",
    "Barlow Condensed:800",
    "Barlow:400",
    "Barlow:500",
    "Barlow:700",
  ],
  layout: [
    "Barlow Condensed:700",
    "Barlow Condensed:800",
    "Barlow:500",
    "Barlow:700",
    "Barlow:400",
  ],
  vouchers: [
    "Barlow Condensed:700",
    "Barlow Condensed:800",
    "Barlow:400",
    "Barlow:500",
    "Barlow:700",
    "Barlow:600",
  ],
  xsed: [
    "Barlow Condensed:300",
    "Barlow Condensed:700",
    "Barlow Condensed:800",
    "Barlow:400",
    "Barlow:500",
    "Barlow:600",
    "Barlow:700",
  ],
};
const base = "https://getrandomtrip.com";
const vouchers = {
  client: "María García",
  documents: [{ label: "Confirmación Ñ", mimeType: "application/pdf" }],
  skippedCount: 1,
  startDate: new Date("2026-10-17T12:00:00Z"),
  endDate: new Date("2026-10-21T12:00:00Z"),
  nights: 4,
  pax: 2,
  tripType: "couple",
  tripId: "font-test",
};
const cases = [
  {
    name: "newsletter",
    locale: "es",
    element: <NewsletterGoLive />,
    text: "ELIGE CÓMO QUIERES VIAJAR",
    href: base,
    order: orders.newsletter,
    last: "700",
  },
  {
    name: "xsed",
    locale: "es",
    element: <XsedCampaign />,
    text: "UNITE A LA LISTA DE ESPERA",
    href: `${base}/es/xsed`,
    order: orders.xsed,
    last: "700",
  },
  ...(["es", "en"] as const).flatMap((locale) => [
    {
      name: `layout-${locale}`,
      locale,
      element: <WelcomeEmail locale={locale} name="María García" />,
      text: "María García",
      href: `${base}/${locale}/journey`,
      order: orders.layout,
      last: "400",
    },
    {
      name: `vouchers-${locale}`,
      locale,
      element: <TripStartVouchers {...vouchers} locale={locale} />,
      text: "Confirmación Ñ",
      href: `${base}/${locale}/dashboard/trips/font-test/reveal`,
      order: orders.vouchers,
      last: "600",
    },
  ]),
];
const attempts: string[] = [];
const offline = new Window({
  settings: {
    disableCSSFileLoading: true,
    disableJavaScriptFileLoading: true,
    enableJavaScriptEvaluation: false,
    handleDisabledFileLoadingAsSuccess: true,
    navigation: {
      disableMainFrameNavigation: true,
      disableChildFrameNavigation: true,
      disableChildPageNavigation: true,
    },
    fetch: {
      interceptor: {
        async beforeAsyncRequest({ request, window }) {
          attempts.push(request.url);
          return new window.Response("", { status: 503 });
        },
        beforeSyncRequest({ request }) {
          attempts.push(request.url);
          throw new Error("Email font tests must not fetch resources");
        },
      },
    },
  },
});
const rendered = new Map<string, EmailDocument>();
function rules(doc: EmailDocument) {
  return [...doc.querySelectorAll("head style")].flatMap((style) => {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(style.textContent ?? "");
    return [...sheet.cssRules];
  });
}
function faces(doc: EmailDocument) {
  return rules(doc).filter(
    (rule) => rule.type === CSSRule.FONT_FACE_RULE,
  ) as CSSFontFaceRule[];
}
function unquote(value: string) {
  return value.replace(/['"]/g, "");
}
beforeAll(async () => {
  for (const fixture of cases) {
    const html = await render(fixture.element);
    rendered.set(
      fixture.name,
      new offline.DOMParser().parseFromString(html, "text/html"),
    );
  }
  await offline.happyDOM.waitUntilComplete();
  expect(attempts).toEqual([]);
});
afterAll(() => offline.happyDOM.close());

it.each(cases)(
  "preserves $name content, destination and final fallback cascade",
  ({ name, locale, text, href, last }) => {
    const doc = rendered.get(name)!;
    expect(doc.documentElement.lang).toBe(locale);
    expect(doc.body.textContent).toContain(text);
    expect(doc.querySelector(`a[href="${href}"]`)).not.toBeNull();
    const finalFace = faces(doc).at(-1)!.style;
    expect(unquote(finalFace.getPropertyValue("font-family"))).toBe("Barlow");
    expect(finalFace.getPropertyValue("font-weight")).toBe(last);
    const globals = rules(doc).filter(
      (rule) => (rule as CSSStyleRule).selectorText === "*",
    ) as CSSStyleRule[];
    expect(unquote(globals.at(-1)!.style.getPropertyValue("font-family"))).toBe(
      "Barlow, Arial",
    );
  },
);

// Verified official Latin WOFF2 binaries: family/OS2 weight and Spanish glyphs.
// These are offline expectations; tests never download font resources.
const urls: Record<string, string> = {
  "Nothing You Could Do:400":
    "https://fonts.gstatic.com/s/nothingyoucoulddo/v21/oY1B8fbBpaP5OX3DtrRYf_Q2BPB1SnfZb3OOnVsH2pmp.woff2",
  "Barlow Condensed:300":
    "https://fonts.gstatic.com/s/barlowcondensed/v13/HTxwL3I-JCGChYJ8VI-L6OO_au7B47rxz3bWuYMBYro.woff2",
  "Barlow Condensed:700":
    "https://fonts.gstatic.com/s/barlowcondensed/v13/HTxwL3I-JCGChYJ8VI-L6OO_au7B46r2z3bWuYMBYro.woff2",
  "Barlow Condensed:800":
    "https://fonts.gstatic.com/s/barlowcondensed/v13/HTxwL3I-JCGChYJ8VI-L6OO_au7B47b1z3bWuYMBYro.woff2",
  "Barlow:400":
    "https://fonts.gstatic.com/s/barlow/v13/7cHpv4kjgoGqM7E_DMs5ynghnQ.woff2",
  "Barlow:500":
    "https://fonts.gstatic.com/s/barlow/v13/7cHqv4kjgoGqM7E3_-gs51ostz0rdg.woff2",
  "Barlow:600":
    "https://fonts.gstatic.com/s/barlow/v13/7cHqv4kjgoGqM7E30-8s51ostz0rdg.woff2",
  "Barlow:700":
    "https://fonts.gstatic.com/s/barlow/v13/7cHqv4kjgoGqM7E3t-4s51ostz0rdg.woff2",
};
it.each(cases)(
  "provides $name font weights from the matching verified binaries",
  ({ name, order }) => {
    const actual = faces(rendered.get(name)!).map(({ style }) => ({
      family: unquote(style.getPropertyValue("font-family")),
      weight: style.getPropertyValue("font-weight"),
      style: style.getPropertyValue("font-style"),
      src: style.getPropertyValue("src"),
    }));
    expect(actual).toEqual(
      order.map((key) => {
        const [family, weight] = key.split(":");
        return {
          family,
          weight,
          style: "normal",
          src: `url(${urls[key]}) format('woff2')`,
        };
      }),
    );
  },
);
it.each(cases)(
  "does not require an external Google CSS stylesheet for $name",
  ({ name }) => {
    const links = rendered
      .get(name)!
      .querySelectorAll(
        'link[rel="stylesheet"][href^="https://fonts.googleapis.com/"]',
      );
    expect(links).toHaveLength(0);
  },
);

it.each(cases)("keeps each $name face's fallback stack", ({ name, order }) => {
  const globals = rules(rendered.get(name)!).filter(
    (rule) => (rule as CSSStyleRule).selectorText === "*",
  ) as CSSStyleRule[];
  expect(
    globals.map(({ style }) => unquote(style.getPropertyValue("font-family"))),
  ).toEqual(
    order.map((key) => {
      const [family] = key.split(":");
      return `${family}, ${family === "Nothing You Could Do" ? "Georgia" : "Arial"}`;
    }),
  );
});
