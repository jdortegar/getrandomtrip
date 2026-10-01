import type { ExperienceFormDraft } from "@/types/tripper";

export type ExperienceCopyLocale = "en" | "es";

export type ExperienceCopyPiece =
  | { html: boolean; id: "description" | "teaser" | "title"; text: string }
  | {
      html: boolean;
      id: "activity";
      index: number;
      key: "description" | "name" | "risks";
      text: string;
    }
  | {
      html: boolean;
      id: "itinerary";
      index: number;
      key: "description" | "title";
      text: string;
    };

export function sourceLocaleFor(target: ExperienceCopyLocale): ExperienceCopyLocale {
  return target === "en" ? "es" : "en";
}

/** Visible text after tags and non-breaking spaces are removed. */
export function visibleCopyText(value: string): string {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isHtml(value: string): boolean {
  return /<\/?[a-z][^>]*>/i.test(value);
}

function pushIfPresent(pieces: ExperienceCopyPiece[], piece: ExperienceCopyPiece) {
  if (visibleCopyText(piece.text)) pieces.push(piece);
}

/** Prose fields an admin can translate. Images, prices, and selectors stay put. */
export function collectExperienceCopy(form: ExperienceFormDraft): ExperienceCopyPiece[] {
  const pieces: ExperienceCopyPiece[] = [];

  pushIfPresent(pieces, { html: false, id: "title", text: form.title });
  pushIfPresent(pieces, { html: false, id: "teaser", text: form.teaser });
  pushIfPresent(pieces, {
    html: isHtml(form.description),
    id: "description",
    text: form.description,
  });

  form.activities.forEach((activity, index) => {
    pushIfPresent(pieces, {
      html: false,
      id: "activity",
      index,
      key: "name",
      text: activity.name,
    });
    pushIfPresent(pieces, {
      html: isHtml(activity.description),
      id: "activity",
      index,
      key: "description",
      text: activity.description,
    });
    pushIfPresent(pieces, {
      html: isHtml(activity.risks),
      id: "activity",
      index,
      key: "risks",
      text: activity.risks,
    });
  });

  form.itinerary.forEach((day, index) => {
    pushIfPresent(pieces, {
      html: false,
      id: "itinerary",
      index,
      key: "title",
      text: day.title,
    });
    pushIfPresent(pieces, {
      html: isHtml(day.description),
      id: "itinerary",
      index,
      key: "description",
      text: day.description,
    });
  });

  return pieces;
}

export function applyExperienceCopy(
  form: ExperienceFormDraft,
  pieces: ExperienceCopyPiece[],
): ExperienceFormDraft {
  return pieces.reduce<ExperienceFormDraft>((current, piece) => {
    if (piece.id === "activity") {
      return {
        ...current,
        activities: current.activities.map((entry, index) =>
          index === piece.index ? { ...entry, [piece.key]: piece.text } : entry,
        ),
      };
    }

    if (piece.id === "itinerary") {
      return {
        ...current,
        itinerary: current.itinerary.map((entry, index) =>
          index === piece.index ? { ...entry, [piece.key]: piece.text } : entry,
        ),
      };
    }

    return { ...current, [piece.id]: piece.text };
  }, form);
}
