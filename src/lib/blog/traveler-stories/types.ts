export interface StorySection {
  heading: string;
  paragraphs: [string, string];
}

export interface StoryCopy {
  category: string;
  sections: [StorySection, StorySection, StorySection, StorySection];
  subtitle: string;
  title: string;
}

export interface StoryGalleryImage {
  captionEn: string;
  captionEs: string;
  photoId: string;
}

export interface TravelerStory {
  coverPhotoId: string;
  en: StoryCopy;
  es: StoryCopy;
  gallery: [StoryGalleryImage, StoryGalleryImage, StoryGalleryImage, StoryGalleryImage];
  slug: string;
  travelType: "couple" | "group" | "solo";
}

export function unsplash(photoId: string): string {
  return `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=1600&q=80`;
}
