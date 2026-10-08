import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";
import { XsedSummary } from "../XsedSummary";

function renderTotal(travelType: "solo" | "couple" | "", pax: number) {
  const template = document.createElement("template");
  template.innerHTML = renderToStaticMarkup(
    <XsedSummary
      brand={en.xsedBook.hero.brand}
      copy={en.xsedBook.summary}
      excuse={null}
      onEdit={() => {}}
      originCity="Buenos Aires"
      originCountry="Argentina"
      pax={pax}
      travelType={travelType}
      travelTypeLabel=""
    />,
  );
  return template.content.textContent ?? "";
}

describe("XsedSummary pricing", () => {
  it("charges the solo rate for a solo traveler", () => {
    const text = renderTotal("solo", 1);
    expect(text).toContain("USD 350");
    expect(text).not.toContain("USD 250");
  });

  it("charges the standard rate per person for other travel types", () => {
    expect(renderTotal("couple", 2)).toContain("USD 500");
  });

  it("shows the standard rate before a travel type is chosen", () => {
    expect(renderTotal("", 2)).toContain("USD 250");
  });
});

describe("XsedSummary localized copy and excuse", () => {
  function render(
    locale: "en" | "es",
    excuse: Parameters<typeof XsedSummary>[0]["excuse"],
  ) {
    const book = locale === "en" ? en.xsedBook : es.xsedBook;
    const template = document.createElement("template");
    template.innerHTML = renderToStaticMarkup(
      <XsedSummary
        brand={book.hero.brand}
        copy={book.summary}
        excuse={excuse}
        onEdit={() => {}}
        originCity="Buenos Aires"
        originCountry="Argentina"
        pax={2}
        travelType="couple"
        travelTypeLabel={book.travelType.couple}
      />,
    );
    return template.content.textContent ?? "";
  }

  it.each(["en", "es"] as const)("renders dictionary copy in %s", (locale) => {
    const book = locale === "en" ? en.xsedBook : es.xsedBook;
    const text = render(locale, null);
    expect(text).toContain(book.summary.title);
    expect(text).toContain(book.summary.productDetail);
    expect(text).toContain(book.summary.excuseEmpty);
    expect(text).toContain(book.summary.importantItems[0]);
    expect(text).toContain(book.hero.brand);
    expect(text).toContain(book.summary.personOther.replace("{count}", "2"));
  });

  it("shows the chosen excuse title and refine labels", () => {
    const text = render("en", {
      title: "Foodie lovers",
      refineDetails: [
        { key: "a", label: "Street food" },
        { key: "b", label: "Wine" },
      ],
    });
    expect(text).toContain("Foodie lovers");
    expect(text).toContain("Street food, Wine");
    expect(text).not.toContain(en.xsedBook.summary.excuseEmpty);
  });
});
