export type BlogStatus = 'draft' | 'published';
export type BlogFormat = 'article' | 'photo' | 'video' | 'mixed';

export interface BlogPost {
  id: string;
  slug?: string;
  authorId: string;
  coverUrl?: string;
  title: string;
  subtitle?: string;
  tagline?: string;
  content?: string | null;
  blocks: Array<
    | { type: 'paragraph'; text: string }
    | { type: 'image'; url: string; caption?: string }
    | { type: 'video'; url: string; caption?: string }         // soporta mp4 u HLS
    | { type: 'embed'; provider: 'youtube'|'vimeo'|'map'|'other'; url: string; title?: string }
    | { type: 'quote'; text: string; cite?: string }
    | { type: 'faq'; items: { question: string; answer: string }[] }
  >;
  faq?: { items: { question: string; answer: string }[] } | null;
  tags: string[];
  format: BlogFormat;
  status: BlogStatus;
  seo?: { title?: string; description?: string; keywords?: string[] };
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}
