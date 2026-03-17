import type { TravelerTypeData } from '@/types/traveler-type';
import type { HeroContent } from '@/components/Hero';
import type { ParagraphContent } from '@/components/Paragraph';
import type { TypePlannerContent } from '@/types/planner';
import type { BlogPost, BlogViewAll } from '@/lib/data/shared/blog-types';
import type { Testimonial } from '@/lib/data/shared/testimonial-types';
import { getExcusesByType } from '@/lib/helpers/excuse-helper';

export const familyEn: TravelerTypeData = {
  meta: {
    slug: 'family',
    label: 'Family',
    aliases: ['familia', 'families'],
    pageTitle: 'Family | Randomtrip',
  },
  content: {
    hero: {
      title: 'Kin© Randomtrip',
      subtitle:
        'Family travel is about moving, discovering each other, and creating stories that will be told a thousand times at the dinner table.',
      tagline: 'Getaways designed for the whole family',
      scrollText: 'SCROLL',
      videoSrc: '/videos/family-hero-video.mp4',
      fallbackImage: '/images/journey-types/family-traveler.jpg',
      primaryCta: {
        ariaLabel: 'Go to blog section',
        href: '#blog',
        text: 'Inspiring stories',
      },
      secondaryCta: {
        ariaLabel: 'Start your family trip',
        href: '#type-planner',
        text: 'RANDOMTRIP-we!',
      },
    } as HeroContent,
    story: {
      title: 'Family',
      paragraphs: [
        'A family getaway doesn\'t start on the road, at the airport, or at the station—it starts at the kitchen table, when someone says "what if…?". That simple trigger, between a plate of pasta and the debate over who does the dishes, is where the best adventures are born.',
        'At Randomtrip we know you don\'t need to cross the world to feel far away: a couple of days is enough to see your loved ones in a new light. The little ones turn any corner into a playground, teens discover they can still be surprised, and grandparents laugh out loud again.',
        'We design getaways without templates or scripts. Short, intense, full of moments that unfold step by step. Days that fly by, nights that stay in memory, stories that will be told at every dinner. Because getaways end, but stories remain.',
      ],
      eyebrow: 'Stories that remain',
    } as ParagraphContent,
  },
  planner: {
    title: 'Design your family Randomtrip',
    subtitle: '3 short steps so we can start creating the best experience.',
    levels: [
      {
        id: 'essenza',
        maxNights: 2,
        name: 'Essenza',
        subtitle: 'The express getaway',
        price: 350,
        priceLabel: 'Up to',
        priceFootnote: 'per person',
        features: [
          { title: 'Duration', description: 'Max. 2 nights (Quick escape)' },
          { title: 'Destinations', description: 'Domestic cities' },
          { title: 'Transport', description: 'Land / Low cost (Practical arrival)' },
          { title: 'Accommodation', description: 'Comfort (3★) - Functional and stylish' },
          {
            title: 'Benefits',
            description: 'Essential guide so everyone enjoys without hassle.',
          },
        ],
        closingLine: 'A family getaway with the essentials, no stress, so everyone enjoys.',
        ctaLabel: 'Book easy',
        excuses: getExcusesByType('family'),
      },
      {
        id: 'explora',
        maxNights: 3,
        name: 'Explora Mode',
        subtitle: 'Active and flexible trip',
        price: 550,
        priceLabel: 'Up to',
        priceFootnote: 'per person',
        features: [
          { title: 'Duration', description: 'Max 3 nights (+More flexibility)' },
          { title: 'Destinations', description: 'Domestic+ (Farther & regional)' },
          { title: 'Transport', description: 'Basic flights (Carry-on only)' },
          { title: 'Accommodation', description: '+ Style (3-4★) - Elevate your stay' },
          {
            title: 'Benefits',
            description: 'Randomtrip guide with activities for all ages.',
          },
        ],
        closingLine: 'For families who want to explore at their own pace, with the flexibility they need.',
        ctaLabel: 'Activate Explora Mode',
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
        price: 850,
        priceLabel: 'Up to',
        priceFootnote: 'per person',
        features: [
          { title: 'Duration', description: 'Max 4 nights (+Long weekends & holidays)' },
          { title: 'Destinations', description: '+ Continental (New frontiers)' },
          { title: 'Transport', description: 'Classic flights (Standard luggage)' },
          { title: 'Accommodation', description: '+ Premium (4★) - Upscale & boutique' },
          {
            title: 'Benefits',
            description:
              '1 curated family experience + Destination Decoded guide (personalized so each day is a curated surprise)',
          },
        ],
        closingLine: 'More days, more activities, more lasting memories for the whole family.',
        ctaLabel: 'Raise the bar',
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
        price: 1200,
        priceLabel: 'Up to',
        priceFootnote: 'per person',
        features: [
          { title: 'Duration', description: 'Max 5 nights (No restrictions)' },
          { title: 'Destinations', description: '+ Intercontinental (Dream destinations)' },
          { title: 'Transport', description: 'Full flights (Maximum comfort)' },
          { title: 'Accommodation', description: '+ Upper-scale (4-5★) - Design and service' },
          {
            title: 'Benefits',
            description:
              '1 exclusive experience + perks (e.g. late check-out, upgrade, amenities) + Destination Decoded guide (curated by our Tripper Travel Advisors)',
          },
        ],
        closingLine: 'A unique family experience with details that make the difference.',
        ctaLabel: 'Travel different',
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
        subtitle: 'Made-to-measure experience',
        price: 1200,
        priceLabel: 'From',
        priceFootnote: 'per person',
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
        closingLine: 'A made-to-measure experience where the whole family travels as the main character.',
        ctaLabel: 'One click from unforgettable',
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
    title: 'Our favorite destinations for family travel',
    subtitle: 'Stories, destinations and creative triggers to choose better.',
    posts: [
      {
        href: '/blogs/families',
        image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee',
        category: 'Inspiration',
        title: 'Explore our Trippers’ stories',
      },
      {
        href: '/blogs/families',
        image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e',
        category: 'Tips',
        title: 'Our favorite places for the whole family',
      },
      {
        href: '/blogs/families',
        image: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429',
        category: 'Experiences',
        title: 'Ideas for different ages and styles',
      },
      {
        href: '/blogs/families',
        image: 'https://images.unsplash.com/photo-1543248939-ff40856f65d4',
        category: 'Guides',
        title: 'How to plan a stress-free family weekend',
      },
      {
        href: '/blogs/families',
        image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470',
        category: 'Adventure',
        title: 'Nature near home: 5 getaways',
      },
      {
        href: '/blogs/families',
        image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800',
        category: 'Culture',
        title: 'Local festivals to enjoy with kids',
      },
    ] as BlogPost[],
    viewAll: {
      title: 'View all stories',
      subtitle: 'Go to Blog',
      href: '/blogs/families',
    } as BlogViewAll,
  },
  testimonials: {
    title: 'What our families say',
    items: [
      {
        quote: 'Everyone enjoyed it, from the youngest to the grandparents. Very well balanced.',
        author: 'The Gómez Family',
        country: 'Argentina',
      },
      {
        quote: 'Activities for all ages. You can tell they thought through every detail.',
        author: 'The López Family',
        country: 'Argentina',
      },
      {
        quote: 'The kids wanted to stay one more day. Beautiful memories for everyone.',
        author: 'The Fernández Family',
        country: 'Argentina',
      },
      {
        quote: 'Flexibility without losing structure. Easy to get around with the little ones.',
        author: 'The Martínez Family',
        country: 'Argentina',
      },
      {
        quote: 'A trip we still talk about at dinner. Worth every penny.',
        author: 'The Silva Family',
        country: 'Chile',
      },
      {
        quote: 'We discovered places we wouldn’t have found on our own. Great experience.',
        author: 'The Rodríguez Family',
        country: 'Peru',
      },
    ] as Testimonial[],
  },
};
