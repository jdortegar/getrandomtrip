import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import Blog from "@/components/Blog";

vi.mock("@/hooks/useDictionary", () => ({ useLocale: () => "en" }));

it.each([
  { postCount: 2, withViewAll: false, hasPeek: false },
  { postCount: 3, withViewAll: false, hasPeek: true },
  { postCount: 1, withViewAll: true, hasPeek: false },
  { postCount: 2, withViewAll: true, hasPeek: true },
])(
  "preserves full cards and only previews an available next slide ($postCount posts, view all: $withViewAll)",
  ({ postCount, withViewAll, hasPeek }) => {
    const template = document.createElement("template");
    template.innerHTML = renderToStaticMarkup(
      <Blog
        posts={Array.from({ length: postCount }, (_, index) => ({
          category: "Travel",
          href: `/en/blog/story-${index}`,
          image: `/images/story-${index}.jpg`,
          title: `Story ${index}`,
        }))}
        title="Traveler stories"
        viewAll={
          withViewAll
            ? {
                href: "/en/blog",
                subtitle: "More stories",
                title: "View all",
              }
            : undefined
        }
      />,
    );
    const cards = template.content.querySelectorAll(
      '[data-component="BlogCard"]',
    );
    const carousel = template.content.querySelector(
      '[data-component="EmblaCarousel"]',
    );

    expect(
      template.content
        .querySelector("#blog")
        ?.classList.contains("overflow-x-clip"),
    ).toBe(true);
    expect(carousel?.classList.contains("overflow-x-clip")).toBe(false);
    expect(carousel?.classList.contains("overflow-visible")).toBe(true);
    expect(
      carousel?.classList.contains("[clip-path:inset(-100vh_-100vw_-100vh_0)]"),
    ).toBe(true);

    expect(cards).toHaveLength(postCount);
    const track = cards[0].parentElement?.parentElement;

    expect(track?.classList.contains("gap-3")).toBe(true);
    expect(track?.children).toHaveLength(postCount + (withViewAll ? 1 : 0));
    for (const slide of Array.from(track?.children ?? [])) {
      const classes = slide.classList;

      expect(classes.contains("flex-[0_0_80%]")).toBe(true);
      expect(classes.contains("sm:flex-[0_0_calc((100%_-_1.5rem)/2.2)]")).toBe(
        hasPeek,
      );
      expect(classes.contains("sm:flex-[0_0_calc(50%_-_0.375rem)]")).toBe(
        !hasPeek,
      );
      for (const breakpoint of ["sm", "md", "lg"]) {
        expect(classes.contains(`${breakpoint}:flex-[0_0_50%]`)).toBe(false);
      }
    }
  },
);
