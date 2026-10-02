/**
 * Creates the solo, couple, and group traveler-type stories as published
 * Randomtrip blog posts. Idempotent: a slug that already exists is left as
 * the editor saved it.
 *
 * Run: npm run db:seed-traveler-stories
 */
import "dotenv/config";
import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { isEnglishBlogReady } from "../src/lib/blog/content-locale";
import { COUPLE_STORIES } from "../src/lib/blog/traveler-stories/couple";
import { GROUP_STORIES } from "../src/lib/blog/traveler-stories/group";
import { SOLO_STORIES } from "../src/lib/blog/traveler-stories/solo";
import {
  unsplash,
  type StoryCopy,
  type StoryGalleryImage,
  type TravelerStory,
} from "../src/lib/blog/traveler-stories/types";
import { seedRandomtripUser } from "./seed-randomtrip-user";

const PUBLISHED_AT = new Date("2026-03-01T00:00:00.000Z");
const STORIES: TravelerStory[] = [
  ...SOLO_STORIES,
  ...GROUP_STORIES,
  ...COUPLE_STORIES,
];

const connectionString = process.env.DATABASE_URL;
const adapter = connectionString
  ? new PrismaPg({ connectionString })
  : undefined;
const prisma = new PrismaClient(
  (adapter ? { adapter, log: ["error"] } : { log: ["error"] }) as object,
);

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function paragraphsHtml(paragraphs: string[]): string {
  return paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("");
}

function articleHtml(copy: StoryCopy): string {
  return copy.sections
    .map(
      (section) =>
        `<h2>${escapeHtml(section.heading)}</h2>${paragraphsHtml(section.paragraphs)}`,
    )
    .join("");
}

function sectionBlocks(copy: StoryCopy) {
  return copy.sections.map((section) => ({
    description: paragraphsHtml(section.paragraphs),
    title: section.heading,
    type: "section" as const,
  }));
}

function imageBlocks(gallery: StoryGalleryImage[], locale: "en" | "es") {
  return gallery.map((image) => ({
    caption: locale === "en" ? image.captionEn : image.captionEs,
    type: "image" as const,
    url: unsplash(image.photoId),
  }));
}

function englishTranslation(story: TravelerStory) {
  const copy = story.en;
  const translation = {
    blocks: sectionBlocks(copy),
    content: articleHtml(copy),
    seo: {
      description: copy.subtitle,
      title: `${copy.title} | Randomtrip`,
    },
    subtitle: copy.subtitle,
    title: copy.title,
  };
  return { en: { ...translation, ready: isEnglishBlogReady(translation) } };
}

async function seedTravelerStories() {
  if (STORIES.length !== 18) {
    throw new Error(`Expected 18 traveler stories, found ${STORIES.length}`);
  }

  const author = await seedRandomtripUser(prisma);
  let created = 0;
  let skipped = 0;

  for (const story of STORIES) {
    const existing = await prisma.blogPost.findUnique({
      where: { slug: story.slug },
      select: { id: true },
    });
    if (existing) {
      skipped += 1;
      console.log(`[seed-traveler-stories] skip ${story.slug}`);
      continue;
    }

    const english = englishTranslation(story);
    if (!english.en.ready) {
      throw new Error(`English copy is not ready: ${story.slug}`);
    }

    await prisma.blogPost.create({
      data: {
        authorId: author.id,
        blocks: [
          ...sectionBlocks(story.es),
          ...imageBlocks(story.gallery, "es"),
        ] as Prisma.InputJsonValue,
        content: articleHtml(story.es),
        coverUrl: unsplash(story.coverPhotoId),
        format: "ARTICLE",
        isActive: true,
        publishedAt: PUBLISHED_AT,
        seo: {
          description: story.es.subtitle,
          title: `${story.es.title} | Randomtrip`,
        },
        slug: story.slug,
        source: "RANDOMTRIP",
        status: "PUBLISHED",
        subtitle: story.es.subtitle,
        tags: [story.es.category],
        title: story.es.title,
        translations: english as Prisma.InputJsonValue,
        travelType: [story.travelType],
      },
    });
    created += 1;
    console.log(`[seed-traveler-stories] created ${story.slug}`);
  }

  console.log(
    `[seed-traveler-stories] created=${created} skipped=${skipped}`,
  );
}

seedTravelerStories()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
