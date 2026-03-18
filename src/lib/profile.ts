/**
 * Types for public profile (tripper/traveler profile view).
 */

export interface PublicProfilePrefs {
  dailyBudgetUSD?: number;
  lodging?: string;
  style?: string[];
}

export interface PublicProfileReview {
  id: string;
  title: string;
  rating: number;
  excerpt: string;
  date?: string;
}

export interface PublicProfileFavorite {
  id: string;
  image: string;
  href: string;
  title: string;
}

export interface PublicProfilePost {
  id: string;
  excerpt: string;
  href: string;
  title: string;
}

export interface PublicProfile {
  favorites?: PublicProfileFavorite[];
  posts?: PublicProfilePost[];
  prefs?: PublicProfilePrefs;
  reviews?: PublicProfileReview[];
}
