export interface BlogPost {
  image: string;
  category: string;
  title: string;
  href?: string;
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
