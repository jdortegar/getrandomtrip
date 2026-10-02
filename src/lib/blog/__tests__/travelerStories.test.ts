import { describe, expect, it } from "vitest";
import {
  getTravelerStoryArticle,
  travelerStoryCards,
  travelerStorySlugs,
} from "../travelerStories";

describe("traveler stories", () => {
  it("keeps a Spanish article for every solo, couple, and group card", () => {
    const slugs = travelerStorySlugs();
    expect(slugs).toHaveLength(18);

    const solo = getTravelerStoryArticle("viajar-solo-la-mejor-decision", "es");
    const couple = getTravelerStoryArticle("razones-para-un-viaje-sorpresa-en-pareja", "es");
    const group = getTravelerStoryArticle("momentos-que-solo-pasan-viajando-en-grupo", "es");

    expect(solo?.title).toBe("Viajar Solo: La Mejor Decisión que Puedes Tomar");
    expect(solo?.content.startsWith("<p>")).toBe(true);
    expect(couple?.title).toBe("5 Razones para Amar un Viaje Sorpresa en Pareja");
    expect(group?.title).toBe("10 momentos que solo pasan viajando en grupo");
    expect(getTravelerStoryArticle("viajar-solo-la-mejor-decision", "en")?.title).toBe(
      "Traveling Solo: The Best Decision You Can Make",
    );
  });

  it("builds the cards with the article path", () => {
    const [card] = travelerStoryCards(["organizar-un-viaje-con-amigos-sin-drama"], "es");
    expect(card).toMatchObject({
      href: "/blog/organizar-un-viaje-con-amigos-sin-drama",
      title: "Cómo organizar un viaje con amigos sin drama",
    });
  });
});
