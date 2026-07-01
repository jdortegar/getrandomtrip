export interface BlogIndexAuthor {
  avatarUrl: string;
  id: string;
  name: string;
  slug: string;
}

export interface BlogIndexPost {
  /** Single author (tripper) per post. */
  author: BlogIndexAuthor;
  coverUrl: string | null;
  excuseKey: string | null;
  format: string;
  id: string;
  publishedAt?: string;
  slug: string;
  subtitle: string;
  tagline?: string;
  tags: string[];
  title: string;
  travelType: string | null;
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
