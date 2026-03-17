import type { TravelerTypeData } from '@/types/traveler-type';
import type { HeroContent } from '@/components/Hero';
import type { ParagraphContent } from '@/components/Paragraph';
import type { TypePlannerContent } from '@/types/planner';
import type { BlogPost, BlogViewAll } from '@/lib/data/shared/blog-types';
import type { Testimonial } from '@/lib/data/shared/testimonial-types';
import { getExcusesByType } from '@/lib/helpers/excuse-helper';

export const pawsEn: TravelerTypeData = {
  meta: {
    slug: 'paws',
    label: 'PAWS',
    aliases: ['mascotas'],
    pageTitle: 'PAWS | Randomtrip',
  },
  content: {
    hero: {
      title: 'Paws© Randomtrip',
      subtitle:
        'Traveling with them is part of the plan. We design getaways where your four-legged best friend is also the star.',
      tagline: 'Adventures with paw prints',
      scrollText: 'SCROLL',
      videoSrc: '/videos/paws-hero-video.mp4',
      fallbackImage: '/images/journey-types/paws-card.jpg',
      primaryCta: {
        ariaLabel: 'Go to blog section',
        href: '#blog',
        text: 'Inspiring stories',
      },
      secondaryCta: {
        ariaLabel: 'Start your trip with your pet',
        href: '#type-planner',
        text: '🐾 RANDOMTRIP-paws!',
      },
    } as HeroContent,
    story: {
      title: 'Adventure with Paw Prints',
      paragraphs: [
        'They say life is better with company… and few companions are as loyal as the one waiting for you at home with a wagging tail or a purr.',
        'At PAWS© RANDOMTRIP we believe trips shouldn\'t leave anyone behind. We design getaways where your pet isn\'t a logistical problem—they\'re an essential part of the adventure.',
        'A new path smells different; a forest has sounds that spark curiosity; a beach is territory for running without clocks. They don\'t just accompany you: they teach you to travel differently.',
        'Because some paw prints are left in the sand, and others, forever in memory.',
      ],
      eyebrow: 'Loyal company',
    } as ParagraphContent,
  },
  planner: {
    title: 'Design your PAWS Randomtrip',
    subtitle: 'Three simple steps for an adventure where your pet is the star.',
    levels: [
      {
        id: 'essenza',
        maxNights: 2,
        name: 'Essenza',
        subtitle: 'The express getaway',
        price: 490,
        priceLabel: 'Up to',
        priceFootnote: 'per person\n+ pet',
        features: [
          { title: 'Duration', description: 'Max. 2 nights (Quick escape)' },
          { title: 'Destinations', description: 'Domestic cities' },
          { title: 'Transport', description: 'Land / Low cost (Practical arrival)' },
          { title: 'Accommodation', description: 'Comfort (3★) - Functional and pet-friendly' },
          { title: 'Benefits', description: 'Essential guide with pet-friendly map' },
        ],
        closingLine: 'A simple escape where your pet isn\'t an extra—they\'re part of the plan.',
        ctaLabel: 'Start with the basics',
        excuses: getExcusesByType('paws'),
      },
      {
        id: 'explora',
        maxNights: 3,
        name: 'Explora Mode',
        subtitle: 'Active and flexible trip',
        price: 770,
        priceLabel: 'Up to',
        priceFootnote: 'per person\n+ pet',
        features: [
          { title: 'Duration', description: 'Max 3 nights (+More flexibility)' },
          { title: 'Destinations', description: 'Domestic+ (Farther & regional)' },
          { title: 'Transport', description: 'Basic flights (Carry-on only)' },
          { title: 'Accommodation', description: '+ Style (3-4★) - Elevate your stay, pet-friendly' },
          {
            title: 'Benefits',
            description: 'General guide + tips, with routes, play spots and pet-friendly activities.',
          },
        ],
        closingLine: 'Trails and corners designed to discover with your companion, with freedom and no stress.',
        ctaLabel: 'Explore on four paws',
        excuses: [
          {
            key: 'default-excuse',
            title: 'Standard Experience',
            description: 'A complete, well-balanced experience.',
            img: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e',
            details: {
              title: 'Standard Experience',
              core: 'A complete, well-balanced experience.',
              ctaLabel: 'Continue →',
              tint: 'bg-blue-900/30',
              heroImg: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e',
              options: [
                {
                  key: 'standard-option',
                  label: 'Standard Option',
                  desc: 'Standard experience included.',
                  img: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e',
                },
              ],
            },
          },
        ],
      },
      {
        id: 'exploraPlus',
        maxNights: 4,
        name: 'Explora+',
        subtitle: 'More layers, more moments',
        price: 1190,
        priceLabel: 'Up to',
        priceFootnote: 'per person\n+ pet',
        features: [
          { title: 'Duration', description: 'Max 4 nights (+Long weekends & holidays)' },
          { title: 'Destinations', description: '+ Continental (New frontiers)' },
          { title: 'Transport', description: 'Classic flights (Standard luggage)' },
          { title: 'Accommodation', description: '+ Premium (4★) - Upscale & boutique, pet-friendly' },
          {
            title: 'Benefits',
            description: '1 experience included (e.g. pet-friendly trail or day trip) + Destination Decoded guide',
          },
        ],
        closingLine: 'More days, more play, more paw prints in the sand and in memory.',
        ctaLabel: 'Raise the adventure',
        excuses: [
          {
            key: 'default-excuse',
            title: 'Premium Experience',
            description: 'The best of the best for an unforgettable experience.',
            img: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e',
            details: {
              title: 'Premium Experience',
              core: 'The best of the best for an unforgettable experience.',
              ctaLabel: 'Continue →',
              tint: 'bg-purple-900/30',
              heroImg: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e',
              options: [
                {
                  key: 'premium-option',
                  label: 'Premium Option',
                  desc: 'Premium experience included.',
                  img: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e',
                },
              ],
            },
          },
        ],
      },
      {
        id: 'bivouac',
        maxNights: 5,
        name: 'Bivouac',
        subtitle: 'Total disconnection',
        price: 1680,
        priceLabel: 'Up to',
        priceFootnote: 'per person\n+ pet',
        features: [
          { title: 'Duration', description: 'Max 5 nights (No restrictions)' },
          { title: 'Destinations', description: '+ Intercontinental (Dream destinations)' },
          { title: 'Transport', description: 'Full flights (Maximum comfort)' },
          {
            title: 'Accommodation',
            description: '+ Upper-scale (4-5★) - Design and service, pet-friendly',
          },
          {
            title: 'Benefits',
            description:
              '1 exclusive experience + perks (e.g. late check-out, upgrade, amenities) + Destination Decoded guide (curated by our Tripper Travel Advisors)',
          },
        ],
        closingLine: 'A premium trip, curated in detail for you and your four-legged companion.',
        ctaLabel: 'Travel with paw prints',
        excuses: [
          {
            key: 'default-excuse',
            title: 'Premium Experience',
            description: 'The best of the best for an unforgettable experience.',
            img: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e',
            details: {
              title: 'Premium Experience',
              core: 'The best of the best for an unforgettable experience.',
              ctaLabel: 'Continue →',
              tint: 'bg-purple-900/30',
              heroImg: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e',
              options: [
                {
                  key: 'premium-option',
                  label: 'Premium Option',
                  desc: 'Premium experience included.',
                  img: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e',
                },
              ],
            },
          },
        ],
      },
      {
        id: 'atelier',
        maxNights: 7,
        name: 'Atelier Getaway',
        subtitle: 'Your personal Tripper Advisor',
        price: 1680,
        priceLabel: 'From',
        priceFootnote: 'per person\n+ pet',
        features: [
          { title: 'Duration', description: '100% flexible (No limit on days)' },
          { title: 'Destinations', description: 'Global (The world within reach)' },
          { title: 'Transport', description: 'Flex / Premium / Private (Made to measure)' },
          { title: 'Accommodation', description: 'High-end & author hotels (Curated selection)' },
          {
            title: 'Benefits',
            description: 'Trip co-creation with a Tripper Travel Advisor + 24/7 support team.',
          },
        ],
        closingLine: 'An exclusive experience where every moment is designed for both of you.',
        ctaLabel: 'Create the extraordinary',
        excuses: [
          {
            key: 'default-excuse',
            title: 'Premium Experience',
            description: 'The best of the best for an unforgettable experience.',
            img: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e',
            details: {
              title: 'Premium Experience',
              core: 'The best of the best for an unforgettable experience.',
              ctaLabel: 'Continue →',
              tint: 'bg-purple-900/30',
              heroImg: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e',
              options: [
                {
                  key: 'premium-option',
                  label: 'Premium Option',
                  desc: 'Premium experience included.',
                  img: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e',
                },
              ],
            },
          },
        ],
      },
    ],
  } as TypePlannerContent,
  blog: {
    title: 'Adventures with your best friend',
    subtitle: 'Destinations and tips for traveling with your pet.',
    posts: [
      {
        href: '/blogs/paws',
        image: 'https://images.unsplash.com/photo-1450778869180-41d0601e046e',
        category: 'Tips',
        title: 'How to travel with your pet stress-free',
      },
      {
        href: '/blogs/paws',
        image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e',
        category: 'Destinations',
        title: 'The best pet-friendly destinations',
      },
      {
        href: '/blogs/paws',
        image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b',
        category: 'Experiences',
        title: 'Our trip with Max through Patagonia',
      },
      {
        href: '/blogs/paws',
        image: 'https://images.unsplash.com/photo-1543248939-ff40856f65d4',
        category: 'Guides',
        title: 'Documentation needed to travel with pets',
      },
      {
        href: '/blogs/paws',
        image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470',
        category: 'Adventure',
        title: 'Hiking with dogs: recommended routes',
      },
      {
        href: '/blogs/paws',
        image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800',
        category: 'Health',
        title: 'Vet tips for long trips',
      },
    ] as BlogPost[],
    viewAll: {
      title: 'View all stories',
      subtitle: 'Go to Blog',
      href: '/blogs/paws',
    } as BlogViewAll,
  },
  testimonials: {
    title: 'What our pet travelers say',
    items: [
      {
        quote: 'My dog enjoyed it as much as I did. Amazing pet-friendly places.',
        author: 'Lucía & Max',
        country: 'Argentina',
      },
      {
        quote: 'Everything was designed for traveling with a pet. No hassle.',
        author: 'Pedro & Luna',
        country: 'Uruguay',
      },
      {
        quote: 'We found beaches, parks and restaurants perfect for going with Toby.',
        author: 'Ana & Toby',
        country: 'Chile',
      },
      {
        quote: 'My cat traveled comfortable and safe. Great experience for both.',
        author: 'María & Michi',
        country: 'Peru',
      },
      {
        quote: 'Activities and accommodations ideal for traveling with our furry one.',
        author: 'Juan & Rocky',
        country: 'Argentina',
      },
      {
        quote: 'A trip the whole family enjoyed, including our pet.',
        author: 'The López Family & Coco',
        country: 'Argentina',
      },
    ] as Testimonial[],
  },
};
