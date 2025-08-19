// Trip-related types
export type TripType = 'vuelo_hotel' | 'solo_hotel' | 'experiencia';
export type TravelersOption = 1 | 2 | 3 | 4 | 5 | 6;

// City and location types
export interface CityOption {
  code: string;
  label: string;
  country?: string;
}

export interface TripTypeOption {
  value: TripType;
  label: string;
}

// Content types
export interface Testimonial {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  date: string;
  review: string;
  googleReviewUrl: string;
}

export interface Destination {
  id: string;
  name: string;
  country: string;
  description: string;
  price: string;
  gradient: string;
}

export interface Feature {
  id: string;
  title: string;
  description: string;
  icon: string;
  gradient: string;
}

export interface Step {
  id: string;
  number: number;
  title: string;
  description: string;
  gradient: string;
}

export interface TripCard {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  link: string;
}

export interface CityCard {
  id: string;
  name: string;
  imageUrl: string;
}

export interface TrustSignal {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface NewsletterHero {
  title: string;
  subtitle: string;
  placeholder: string;
  buttonText: string;
  disclaimer: string;
  privacyLink: string;
  backgroundImage: string;
}

export interface TrustSignalItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
}

export interface CounterItem {
  id: string;
  number: string;
  label: string;
}

export interface FooterLink {
  id: string;
  text: string;
  url: string;
}

export interface FooterSection {
  id: string;
  title: string;
  links: FooterLink[];
}

export interface FooterContact {
  email: string;
  phone: string;
}

export interface FooterSocial {
  id: string;
  name: string;
  icon: string;
  url: string;
}

export interface FooterNewsletter {
  placeholder: string;
  buttonText: string;
  disclaimer: string;
  privacyLink: string;
}

export interface FooterLegal {
  links: FooterLink[];
  copyright: string;
  companyInfo: string;
}

export interface FooterData {
  language: string;
  contact: FooterContact;
  waynaboxLinks: FooterLink[];
  discoverLinks: FooterLink[];
  socialLinks: FooterSocial[];
  newsletter: FooterNewsletter;
  legal: FooterLegal;
}
