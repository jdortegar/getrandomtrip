export type ParagraphBlock = { type: "paragraph"; text: string };
export type ImageBlock = { type: "image"; url: string; caption?: string };
export type VideoBlock = { type: "video"; url: string; caption?: string };
export type EmbedProvider = "youtube" | "vimeo" | "map" | "other";
export type EmbedBlock = { type: "embed"; provider: EmbedProvider; url: string; title?: string };
export type QuoteBlock = { type: "quote"; text: string; cite?: string };

export type BlogBlock = ParagraphBlock | ImageBlock | VideoBlock | EmbedBlock | QuoteBlock;

export interface BlogPost {
  id: string;
  title: string;
  subtitle?: string;
  tagline?: string;
  coverUrl?: string;
  tags?: string[];
  authorHandle?: string;
  blocks: BlogBlock[];
  createdAt?: string;
  updatedAt?: string;
  status?: "draft" | "published";
}
