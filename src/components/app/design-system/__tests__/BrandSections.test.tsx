import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { BrandColor } from "../brand/BrandColor";
import { BrandEssence } from "../brand/BrandEssence";
import { BrandLogo } from "../brand/BrandLogo";
import { BrandPhotography } from "../brand/BrandPhotography";
import { BrandTypography } from "../brand/BrandTypography";
import { BrandVoice } from "../brand/BrandVoice";
import { TripperCollectionFrame } from "../brand/TripperCollectionFrame";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";
import type { DesignSystemDict } from "@/lib/types/dictionary";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function text(element: Element | null) {
  return element?.textContent?.replace(/\s+/g, " ").trim();
}

function collapsed(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

describe.each([
  ["en", en.designSystem],
  ["es", es.designSystem],
])("brand sections (%s)", (_locale, raw) => {
  const copy = raw as DesignSystemDict;

  it("stacks the essence hierarchy and sets the North Star in the human voice", () => {
    act(() => root.render(<BrandEssence copy={copy.essence} />));
    const rows = Array.from(container.querySelectorAll("[data-essence-row]"));
    expect(rows.map((row) => row.getAttribute("data-essence-row"))).toEqual([
      "essence",
      "values",
      "character",
      "promise",
      "valueProposition",
      "insight",
      "consumer",
    ]);
    expect(text(rows[0])).toContain(copy.essence.essence.value);
    for (const value of copy.essence.values.items)
      expect(text(rows[1])).toContain(value.name);
    const northStar = Array.from(container.querySelectorAll("p")).find(
      (p) => p.textContent === copy.essence.northStar.value,
    )!;
    expect(northStar.className).toContain("font-nothing-you-could-do");
    expect(northStar.closest(".bg-secondary")).not.toBeNull();
    expect(text(container)).toContain(copy.essence.belief.title);
    expect(text(container)).toContain(copy.essence.purpose.title);
    expect(text(container)).toContain(copy.essence.vision.body);
  });

  it("renders constructions and four logo lockups with accessible names", () => {
    act(() => root.render(<BrandLogo copy={copy.logo} />));
    const srcOf = (selector: string) =>
      container.querySelector<HTMLImageElement>(selector)!.getAttribute("src");
    expect(srcOf('[data-construction="iso"] img')).toContain(
      "iso-randomtrip.svg",
    );
    expect(srcOf('[data-construction="noTagline"] img')).toContain(
      "logo_randomtrip_no_tag.svg",
    );
    expect(srcOf('[data-construction="tagline"] img')).toContain(
      "logo_randomtrip.svg",
    );
    expect(
      container
        .querySelector('[data-construction="iso"] img')!
        .getAttribute("alt"),
    ).toBe(copy.logo.iso.alt);
    const lockups = container.querySelectorAll("[data-lockup]");
    expect(lockups).toHaveLength(4);
    const original = container.querySelector<HTMLImageElement>(
      '[data-lockup="original"] img',
    )!;
    expect(original.getAttribute("alt")).toBe(copy.logo.lockups.original.alt);
    expect(original.getAttribute("src")).toContain(
      "logo_randomtrip_no_tag.svg",
    );
    for (const key of ["teal", "sage", "ochre"] as const) {
      const mask = container.querySelector<HTMLElement>(
        `[data-lockup="${key}"] [role="img"]`,
      )!;
      expect(mask.getAttribute("aria-label")).toBe(copy.logo.lockups[key].alt);
      expect(mask.style.maskImage || mask.getAttribute("style")).toContain(
        "logo_randomtrip_no_tag.svg",
      );
    }
  });

  it("maps every brand color to its palette and role token", () => {
    act(() =>
      root.render(<BrandColor copy={copy.color} usageLabel={copy.usage} />),
    );
    const rows = Array.from(container.querySelectorAll("table tbody tr")).map(
      (row) =>
        Array.from(row.querySelectorAll("th, td")).map((cell) => text(cell)),
    );
    const s = copy.color.swatches;
    const none = copy.color.mapping.none;
    expect(rows).toEqual([
      [s.deepTeal.name, "deep-teal", "primary"],
      [s.mineralSage.name, "mineral-sage", "secondary"],
      [s.ochre.name, "ochre", "feature"],
      [s.offWhite.name, "off-white", "ground"],
      [s.canyonClay.name, "canyon-clay", "xsed"],
      [s.deepTealDark.name, "deep-teal-dark", none],
      [s.sageDark.name, "sage-dark", none],
      [s.skyDrift.name, "sky-drift", none],
      [s.ink.name, "ink", "ink"],
    ]);
    const ratio = container.querySelector("[data-ratio-bar]")!;
    expect(
      Array.from(ratio.querySelectorAll("[data-share]")).map((item) =>
        item.getAttribute("data-share"),
      ),
    ).toEqual(["60", "30", "10", "5"]);
    const shares = Array.from(container.querySelectorAll("[data-ratio-share]"));
    expect(shares.map((share) => share.textContent)).toEqual([
      copy.color.ratio.items.offWhite.share,
      copy.color.ratio.items.mineralSage.share,
      copy.color.ratio.items.deepTeal.share,
      copy.color.ratio.items.ochre.share,
    ]);
    for (const share of shares)
      expect(share.className).toContain("whitespace-nowrap");
    expect(text(container)).toContain(s.canyonClay.usage);
    expect(container.querySelector("details summary")!.textContent).toBe(
      copy.usage,
    );
  });

  it("sets the editorial voice in Bold 700 and lists the type rules", () => {
    act(() => root.render(<BrandTypography copy={copy.typography} />));
    expect(container.querySelector("[data-weight]")).toBeNull();
    const editorial = Array.from(container.querySelectorAll("p")).find(
      (p) => p.textContent === copy.typography.voices.editorial.sample,
    )!;
    expect(editorial.className).toContain("font-barlow-condensed");
    expect(editorial.className).toContain("font-bold");
    expect(editorial.className).not.toContain("font-extrabold");
    for (const voice of Object.values(copy.typography.voices))
      expect(text(container)).toContain(voice.sample);
    const paired = container.querySelector('[data-voice-portrait="paired"]')!;
    expect(paired.querySelector("img")!.getAttribute("src")).toContain(
      "voice-paired.jpg",
    );
    expect(text(paired)).toContain(copy.typography.voices.editorial.sample);
    expect(text(paired)).toContain(copy.typography.voices.human.sample);
    const documentary = container.querySelector(
      '[data-voice-portrait="documentary"]',
    )!;
    expect(documentary.querySelector("img")!.getAttribute("src")).toContain(
      "voice-documentary.jpg",
    );
    expect(text(documentary)).toContain(
      copy.typography.voices.documentary.sample,
    );
    expect(text(container.querySelector("[data-section-lead]")!)).toBe(
      copy.typography.images.lead,
    );
    const rules = container.querySelectorAll("[data-type-rule]");
    expect(rules).toHaveLength(6);
    copy.typography.images.rules.forEach((rule, index) => {
      const card = rules[index];
      const indexLabel = card.querySelector("[data-brand-index]")!;
      const mark = card.querySelector("[data-brand-index-mark]")!;
      expect(text(indexLabel)).toContain(rule.title.split("|")[1]?.trim());
      expect(text(mark)).toMatch(/^\d{2} \|$/);
      expect(mark.className).toContain("text-feature");
      expect(indexLabel.className).toContain("font-barlow-condensed");
      expect(indexLabel.className).toContain("uppercase");
      const works = card.querySelector("[data-type-example='works']")!;
      const fails = card.querySelector("[data-type-example='fails']")!;
      expect(text(works)).toContain(collapsed(rule.works.primary));
      expect(text(fails)).toContain(collapsed(rule.fails.primary));
      expect(works.querySelector("figcaption")?.className).not.toContain(
        "absolute",
      );
      expect(
        works.querySelector("[data-works-fails='works']")?.className,
      ).toContain("text-primary");
      expect(
        fails.querySelector("[data-works-fails='fails']")?.className,
      ).toContain("text-red-700");
      expect(works.querySelector("img")!.getAttribute("src")).toContain(
        "type-0",
      );
      expect(fails.querySelector("img")!.getAttribute("src")).toContain(
        "type-0",
      );
      const worksFrame = works.querySelector("[data-type-frame]")!;
      const failsFrame = fails.querySelector("[data-type-frame]")!;
      expect(worksFrame.className).toBe(failsFrame.className);
    });
  });

  it("shows works and doesn't-work examples for each voice trait and the payoff tiles", () => {
    act(() => root.render(<BrandVoice copy={copy.voice} />));
    expect(text(container.querySelector("[data-voice-character]")!)).toBe(
      copy.voice.characterLabel,
    );
    expect(text(container.querySelector("[data-voice-tone]")!)).toBe(
      copy.voice.toneLabel,
    );
    const traits = container.querySelectorAll("[data-voice-trait]");
    expect(traits).toHaveLength(4);
    copy.voice.cards.forEach((card, index) => {
      expect(text(traits[index])).toContain(card.trait);
      expect(text(traits[index])).toContain(card.description);
      expect(traits[index].querySelector("[data-example]")).toBeNull();
    });
    const cards = container.querySelectorAll("[data-voice-card]");
    expect(cards).toHaveLength(4);
    copy.voice.cards.forEach((card, index) => {
      const works = cards[index].querySelector("[data-example='works']")!;
      const fails = cards[index].querySelector("[data-example='fails']")!;
      expect(text(works)).toContain(card.works);
      expect(text(works)).toContain(copy.voice.worksLabel);
      expect(works.querySelector("p")!.className).toContain(
        "font-nothing-you-could-do",
      );
      expect(
        works.querySelector("[data-works-fails='works']")?.className,
      ).toContain("text-primary");
      expect(works.querySelector("svg")).not.toBeNull();
      expect(text(cards[index])).not.toContain(card.description);
      expect(text(fails)).toContain(card.fails);
      expect(text(fails)).toContain(copy.voice.failsLabel);
      expect(
        fails.querySelector("[data-works-fails='fails']")?.className,
      ).toContain("text-red-700");
      expect(fails.querySelector("svg")).not.toBeNull();
    });
    const tiles = container.querySelectorAll("[data-payoff]");
    expect(
      Array.from(tiles).map((tile) => tile.getAttribute("data-payoff")),
    ).toEqual([
      "philosophy",
      "benefit",
      "promise",
      "emotion",
      "differentiator",
    ]);
    const items = copy.voice.payoffs.items;
    expect(text(tiles[0])).toContain(collapsed(items.philosophy.text));
    expect(text(tiles[2])).toContain(items.promise.accent);
    expect(text(tiles[4])).toContain(items.differentiator.use);
    const payoffText = (index: number) =>
      tiles[index].querySelector("[data-payoff-text]")!;
    expect(payoffText(3).textContent).toBe(items.emotion.text);
    expect(payoffText(3).className).toContain("font-nothing-you-could-do");
    expect(payoffText(0).className).toContain("font-barlow-condensed");
    expect(text(container.querySelector("[data-section-lead]")!)).toBe(
      copy.voice.payoffs.subtitle,
    );
    expect(text(container)).toContain(copy.voice.payoffs.signature.accent);
    expect(
      container.querySelector('[data-component="BrandingAnimation"]'),
    ).not.toBeNull();
    expect(
      container.querySelector("[data-signature-lockup]")?.className,
    ).toContain("[zoom:0.5]");
    for (const tile of tiles) {
      expect(tile.querySelector("img")!.getAttribute("src")).toContain(
        "payoff-",
      );
      const indexLabel = tile.querySelector("[data-brand-index]")!;
      const mark = tile.querySelector("[data-brand-index-mark]")!;
      expect(indexLabel.className).toContain("font-barlow-condensed");
      expect(indexLabel.className).toContain("uppercase");
      expect(indexLabel.className).not.toContain("font-nothing-you-could-do");
      expect(mark.className).toContain("text-feature");
    }
    expect(text(tiles[0].querySelector("[data-brand-index-mark]")!)).toBe(
      "01 |",
    );
    expect(text(tiles[0].querySelector("[data-brand-index]")!)).toContain(
      items.philosophy.label.split("|")[1]?.trim(),
    );
  });

  it("pairs every photography principle with a described photo", () => {
    act(() => root.render(<BrandPhotography copy={copy.photography} />));
    const items = [
      ...copy.photography.philosophy.items,
      ...copy.photography.treatment.items,
    ];
    const cards = container.querySelectorAll("[data-photo-principle]");
    expect(cards).toHaveLength(items.length);
    items.forEach((item, index) => {
      const img = cards[index].querySelector("img")!;
      expect(img.getAttribute("alt")).toBe(item.alt);
      expect(img.getAttribute("src")).toContain("brand-book");
    });
    const headings = container.querySelectorAll("h3");
    expect(headings).toHaveLength(3);
    for (const heading of headings) {
      expect(heading.className).toContain("font-barlow-condensed");
      expect(heading.className).toContain("uppercase");
      expect(heading.className).not.toContain("font-nothing-you-could-do");
    }
    const leads = container.querySelectorAll("[data-section-lead]");
    expect([...leads].map((lead) => lead.textContent)).toEqual([
      copy.photography.philosophy.lead,
      copy.photography.treatment.lead,
      copy.photography.trippers.lead,
    ]);
    for (const lead of leads) {
      expect(lead.className).toContain("font-nothing-you-could-do");
      expect(lead.className).not.toContain("uppercase");
    }
    const frames = container.querySelectorAll("[data-tripper-frame]");
    expect(frames).toHaveLength(4);
    for (const frame of frames) {
      const img = frame.querySelector("img")!;
      expect(img.className).toContain("object-contain");
      expect(img.getAttribute("src")).toContain("tripper-");
    }
    expect(container.textContent).toContain(
      copy.photography.trippers.examplesLabel,
    );
    expect(container.textContent).toContain(
      copy.photography.trippers.principlesLabel,
    );
    for (const principle of copy.photography.trippers.principles) {
      expect(container.textContent).toContain(principle.title);
      expect(container.textContent).toContain(principle.body);
      for (const frame of frames) {
        expect(text(frame)).not.toContain(principle.title);
      }
    }
    const note = copy.photography.trippers.note;
    expect(container.textContent).toContain(note.title);
    expect(container.querySelector(".bg-secondary")?.textContent).toContain(
      note.title,
    );
  });

  it("frames a Tripper with handle, name and collection label", () => {
    const sample = copy.photography.trippers.examples[0];
    if (!sample) throw new Error("Missing tripper sample");
    act(() =>
      root.render(
        <TripperCollectionFrame
          collection={copy.photography.trippers.collection}
          height={1090}
          photo="/images/brand-book/examples/tripper-mateo.jpg"
          sample={sample}
          sizes="100vw"
          strip="sage"
          width={1155}
        />,
      ),
    );
    const frame = container.querySelector("[data-tripper-frame]")!;
    expect(frame.getAttribute("data-strip")).toBe("sage");
    expect(text(frame)).toContain(sample.handle);
    expect(text(frame)).toContain(sample.name);
    expect(text(frame)).toContain(sample.subtitle);
    expect(text(frame)).toContain(sample.quote);
    const label = frame.querySelector("[data-collection-label]")!;
    const { number, role, location } = copy.photography.trippers.collection;
    expect(text(label)).toBe(`${number} ${role} ${location}`);
    expect(frame.querySelector("img")!.getAttribute("alt")).toBe(sample.alt);
    expect(frame.querySelector("img")!.className).toContain("object-contain");
  });
});
