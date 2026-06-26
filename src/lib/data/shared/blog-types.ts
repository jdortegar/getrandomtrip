/** Matches `author` on blog detail (`/api/blogs/...`) and shared tripper UI. */
export interface BlogDetailAuthor {
  id: string;
  name: string;
  slug: string;
  avatarUrl: string;
  bio?: string;
  location?: string;
  motto?: string | null;
  specialization?: string | null;
}

export interface BlogPost {
  image: string;
  category: string;
  title: string;
  href: string;
}

export interface BlogViewAll {
  title: string;
  subtitle: string;
  href: string;
}

export interface BlogContent {
  title: string;
  subtitle: string;
  posts: BlogPost[];
  viewAll?: BlogViewAll;
}
