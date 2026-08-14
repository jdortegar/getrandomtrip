export interface BlogIndexAuthor {
  avatarUrl: string;
  id: string;
  location?: string;
  name: string;
  slug: string;
}

/** Minimal shape needed to render a card — satisfied by BlogIndexPost and by lighter teaser queries. */
export interface BlogTeaserPost {
  author: BlogIndexAuthor;
  coverUrl: string | null;
  slug: string;
  subtitle: string;
  title: string;
}

export interface BlogIndexPost {
  /** Single author (tripper) per post. */
  author: BlogIndexAuthor;
  coverUrl: string | null;
  excuseKey: string[];
  format: string;
  id: string;
  publishedAt?: string;
  slug: string;
  subtitle: string;
  tagline?: string;
  tags: string[];
  title: string;
  travelType: string[];
}

export interface BlogIndexPagination {
  hasMore: boolean;
  limit: number;
  page: number;
  total: number;
  totalPages: number;
}

export interface BlogIndexResponse {
  blogs: BlogIndexPost[];
  pagination: BlogIndexPagination;
}
