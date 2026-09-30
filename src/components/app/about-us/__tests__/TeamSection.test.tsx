import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/postcss";
import postcss from "postcss";
import { act, type CSSProperties, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TeamSection } from "@/components/app/about-us/TeamSection";
import {
  createDomHarness,
  type DomHarness,
} from "@/components/ui/__tests__/test-dom-utils";
import en from "@/dictionaries/en.json";
import es from "@/dictionaries/es.json";

vi.mock("@/components/layout/Section", () => ({
  default: ({ children }: { children: ReactNode }) => <section>{children}</section>,
}));

vi.mock("framer-motion", () => ({
  motion: {
    div: ({
      animate,
      children,
      className,
      style,
    }: {
      animate?: { rotateY?: number };
      children?: ReactNode;
      className?: string;
      style?: CSSProperties;
    }) => (
      <div className={className} data-rotation={animate?.rotateY} style={style}>
        {children}
      </div>
    ),
  },
}));

const members = [
  { name: "Santiago Senega", image: "santiago" },
  { name: "David Ortega", image: "david" },
  { name: "Fabrizio Cavallo", image: "fabrizio" },
  { name: "Carla C. J Vázquez", image: "carla" },
];

let harness: DomHarness;
let supportsHover = false;

beforeEach(() => {
  supportsHover = false;
  vi.spyOn(window, "matchMedia").mockImplementation(
    (query) =>
      ({
        addEventListener: vi.fn(),
        matches: supportsHover,
        media: query,
        removeEventListener: vi.fn(),
      }) as unknown as MediaQueryList,
  );
  harness = createDomHarness();
});

afterEach(() => {
  harness.unmount();
  vi.restoreAllMocks();
});

function flipCard(name: string) {
  return harness.container
    .querySelector(`img[alt="${name}"]`)!
    .closest('[class~="aspect-3/4"]')!;
}

describe("TeamSection", () => {
  it.each([
    { locale: "en", copy: en.aboutUs.curators, linkedinLabel: "View {name} on LinkedIn" },
    { locale: "es", copy: es.aboutUs.curators, linkedinLabel: "Ver a {name} en LinkedIn" },
  ])("renders four versioned portraits and verified profiles in $locale", ({ copy, linkedinLabel }) => {
    harness.render(<TeamSection content={copy} />);

    const images = [...harness.container.querySelectorAll("img")];
    expect(images.map((image) => image.alt)).toEqual(members.map(({ name }) => name));
    expect(harness.container.querySelector('[class~="lg:grid-cols-4"]')).not.toBeNull();

    for (const [index, member] of members.entries()) {
      const image = images[index];
      const optimizedUrl = new URL(image.src, "http://localhost");
      const sourceUrl = new URL(
        optimizedUrl.searchParams.get("url") ?? image.src,
        "http://localhost",
      );
      const path = `/images/about-us-${member.image}.png`;
      const hash = createHash("sha256")
        .update(readFileSync(resolve(process.cwd(), `public${path}`)))
        .digest("hex")
        .slice(0, 12);
      expect(sourceUrl.pathname).toBe(path);
      expect(sourceUrl.searchParams.get("v")).toBe(hash);
      expect(image.getAttribute("width")).toBe("1086");
      expect(image.getAttribute("height")).toBe("1448");
      expect(image.getAttribute("sizes")).toBe(
        "(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw",
      );
      expect(image.classList.contains("object-top")).toBe(true);
    }

    const fabrizio = flipCard("Fabrizio Cavallo").parentElement!;
    expect(fabrizio.textContent).toContain("CMO");
    expect(fabrizio.querySelector("a")?.getAttribute("href")).toBe(
      "https://www.linkedin.com/in/fabrizio-cavallo-b62a662/",
    );
    const fabrizioCopy = copy.items.find(({ name }) => name === "Fabrizio Cavallo")!;
    expect(fabrizio.textContent).toContain(fabrizioCopy.bio);
    expect(fabrizio.textContent).toContain(fabrizioCopy.tagline);

    const links = [...harness.container.querySelectorAll("a")];
    expect(links).toHaveLength(4);
    for (const member of copy.items.filter((item) => "linkedin" in item)) {
      const link = links.find((item) => item.getAttribute("href") === member.linkedin)!;
      expect(link.getAttribute("aria-label")).toBe(linkedinLabel.replace("{name}", member.name));
      expect(link.getAttribute("rel")).toBe("noopener noreferrer");
      expect(link.getAttribute("target")).toBe("_blank");
    }
  });

  it("omits a LinkedIn link when a member has no verified destination", () => {
    const copy = {
      ...en.aboutUs.curators,
      items: en.aboutUs.curators.items.map((member) => ({
        ...member,
        linkedin: member.name === "Fabrizio Cavallo" ? undefined : member.linkedin,
      })),
    };
    harness.render(<TeamSection content={copy} />);
    expect(flipCard("Fabrizio Cavallo").parentElement!.querySelector("a")).toBeNull();
    expect(harness.container.querySelectorAll("a")).toHaveLength(3);
  });

  it.each(members)("flips $name on touch and flips back on a second tap", ({ name }) => {
    harness.render(<TeamSection content={en.aboutUs.curators} />);
    const card = flipCard(name);
    const face = card.querySelector("[data-rotation]")!;
    const details = card.querySelector('[role="region"]')!;
    expect(card.classList.contains("@container/team-card")).toBe(true);
    expect(details.classList.contains("rt-team-details")).toBe(true);
    expect(face.getAttribute("data-rotation")).toBe("0");
    expect(details.hasAttribute("aria-hidden")).toBe(false);
    expect(details.getAttribute("tabindex")).toBe("-1");
    expect(details.classList.contains("overflow-y-auto")).toBe(true);
    harness.click(card);
    expect(face.getAttribute("data-rotation")).toBe("180");
    expect(details.getAttribute("tabindex")).toBe("0");
    harness.click(card);
    expect(face.getAttribute("data-rotation")).toBe("0");
    expect(details.getAttribute("tabindex")).toBe("-1");
  });

  it.each(members)("flips $name on hover and resets when leaving", ({ name }) => {
    supportsHover = true;
    harness.render(<TeamSection content={en.aboutUs.curators} />);
    const card = flipCard(name);
    const face = card.querySelector("[data-rotation]")!;
    harness.click(card);
    expect(face.getAttribute("data-rotation")).toBe("0");
    act(() => card.dispatchEvent(new MouseEvent("mouseover", { bubbles: true })));
    expect(face.getAttribute("data-rotation")).toBe("180");
    act(() => card.dispatchEvent(new MouseEvent("mouseout", { bubbles: true })));
    expect(face.getAttribute("data-rotation")).toBe("0");
  });
});

it("compiles compact card typography without shrinking standard card text", async () => {
  const stylesheet = resolve(process.cwd(), "src/app/globals.css");
  const result = await postcss([tailwindcss({ optimize: false })]).process(
    readFileSync(stylesheet, "utf8"),
    { from: stylesheet },
  );
  const compactRules: string[] = [];
  result.root.walkAtRules("container", (rule) => {
    if (rule.params === "team-card (width < 16rem)") compactRules.push(rule.toString());
  });

  for (const token of [
    "--text-team-bio: 0.75rem;",
    "--text-team-bio--line-height: 1.3125rem;",
    "--text-team-tagline: 1.0625rem;",
    "--text-team-tagline--line-height: 1.375rem;",
    "--leading-team-bio-compact: 1.125rem;",
    "--text-team-tagline-compact: 0.9375rem;",
    "--text-team-tagline-compact--line-height: 1.25rem;",
  ]) {
    expect(result.css.includes(token), token).toBe(true);
  }
  expect(compactRules).toHaveLength(1);
  expect(compactRules[0]).toContain("--text-team-bio--line-height: var(--leading-team-bio-compact)");
  expect(compactRules[0]).toContain("--text-team-tagline: var(--text-team-tagline-compact)");
  expect(compactRules[0]).toContain("padding-bottom: var(--spacing-team-card-roomy)");
});
