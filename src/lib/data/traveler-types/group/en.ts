import type { TravelerTypeData } from '@/types/traveler-type';
import type { HeroContent } from '@/components/Hero';
import type { ParagraphContent } from '@/components/Paragraph';
import type { TypePlannerContent } from '@/types/planner';
import type { BlogPost, BlogViewAll } from '@/lib/data/shared/blog-types';
import type { Testimonial } from '@/lib/data/shared/testimonial-types';
import { getExcusesByType } from '@/lib/helpers/excuse-helper';

export const groupEn: TravelerTypeData = {
  meta: {
    slug: 'group',
    label: 'With Friends',
    aliases: ['grupo', 'amigos'],
    pageTitle: 'With Friends | Randomtrip',
  },
  content: {
    hero: {
      title: 'CREW© RANDOMTRIP',
      subtitle:
        'Teams, friends, shared interests: we design getaways that work for everyone.',
      tagline: 'The best moments are lived in plural',
      scrollText: 'SCROLL',
      videoSrc: '/videos/group-hero-video.mp4',
      fallbackImage: '/images/journey-types/friends-group.jpg',
      primaryCta: {
        ariaLabel: 'Go to blog section',
        href: '#blog',
        text: 'Inspiring stories',
      },
      secondaryCta: {
        ariaLabel: 'Start your group trip',
        href: '#type-planner',
        text: 'RANDOMTRIP-all!',
      },
    } as HeroContent,
    story: {
      title: 'Moments in Plural',
      paragraphs: [
        'The best memories don\'t tell themselves. They\'re built from glances, toasts, and laughter bouncing from one side to the other. Because moments, when lived as a group, weigh more. They have their own gravity.',
        'This isn\'t about coordinating flights or arguing over destinations. It\'s about surrendering to the surprise of being together, without anyone having to play organizer. You bring the story; we turn it into the stage.',
        'It\'ll be a dinner that stretches into the early hours, a walk that becomes ritual, a trip that turns into shared legend. Because what starts in plural is always remembered in capital letters.',
      ],
      eyebrow: 'Perfect company',
    } as ParagraphContent,
  },
  planner: {
    title: 'From friends to teams: design your Randomtrip',
    subtitle: 'Short steps to create the best group experience.',
    levels: [
      {
        id: 'essenza',
        maxNights: 2,
        name: 'Essenza',
        subtitle: 'The essentials, shared',
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
            description: 'Essential guide with simple recommendations for the group.',
          },
        ],
        closingLine: 'A simple getaway to sync schedules, so you only worry about enjoying together.',
        ctaLabel: 'Activate Essenza',
        excuses: getExcusesByType('group'),
      },
      {
        id: 'explora',
        maxNights: 3,
        name: 'Explora Mode',
        subtitle: 'Active and flexible, as a team',
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
            description: 'Randomtrip guide with activities and suggestions for different paces within the group.',
          },
        ],
        closingLine: 'For groups who want to explore at their own pace, with the flexibility they need.',
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
              '1 curated group experience (e.g. private toast, guided sunset walk) + Destination Decoded guide (personalized so each day is a curated surprise)',
          },
        ],
        closingLine: 'More days, more activities, more stories that become shared legend.',
        ctaLabel: 'Level up',
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
              '1 premium group experience (e.g. chef\'s table, private excursion) + perks (e.g. late check-out, upgrade, amenities) + Destination Decoded guide (curated by our Tripper Travel Advisors)',
          },
        ],
        closingLine: 'A unique group experience with details that make the difference.',
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
        subtitle: 'Distinction, made to measure\n\n(Group Edition)',
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
        closingLine: 'The experience that turns any celebration into unforgettable.',
        ctaLabel: 'One click from extraordinary',
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
    title: 'Group travel stories',
    subtitle: 'Shared adventures that become legends.',
    posts: [
      {
        href: '/blogs/group',
        image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee',
        category: 'Stories',
        title: '10 moments that only happen when traveling in a group',
      },
      {
        href: '/blogs/group',
        image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e',
        category: 'Tips',
        title: 'How to organize a trip with friends without drama',
      },
      {
        href: '/blogs/group',
        image: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429',
        category: 'Experiences',
        title: 'The wine route we did with 8 of us',
      },
      {
        href: '/blogs/group',
        image: 'https://images.unsplash.com/photo-1543248939-ff40856f65d4',
        category: 'Guides',
        title: 'Ideal destinations for large groups',
      },
      {
        href: '/blogs/group',
        image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470',
        category: 'Adventure',
        title: 'Group trekking: tips and laughs',
      },
      {
        href: '/blogs/group',
        image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800',
        category: 'Culture',
        title: 'Festivals to go with your crew',
      },
    ] as BlogPost[],
    viewAll: {
      title: 'View all stories',
      subtitle: 'Go to Blog',
      href: '/blogs/group',
    } as BlogViewAll,
  },
  testimonials: {
    title: 'What our groups say',
    items: [
      {
        quote: 'They organized everything perfectly for our group of 10. Zero conflict, pure fun.',
        author: 'BA Friends Group',
        country: 'Argentina',
      },
      {
        quote: 'Everyone could do their own thing without missing the group vibe. Great balance.',
        author: 'The Travelers',
        country: 'Uruguay',
      },
      {
        quote: 'Activities for every taste. Nobody was bored for a second.',
        author: 'Barra del Sur',
        country: 'Argentina',
      },
      {
        quote: 'Logistics were flawless. We could enjoy without worrying.',
        author: 'Crew Mendoza',
        country: 'Argentina',
      },
      {
        quote: 'A trip that strengthened our friendship. Unforgettable.',
        author: 'The Explorers',
        country: 'Chile',
      },
      {
        quote: 'Surprises perfectly calibrated for the group. Highly recommended.',
        author: 'Squad Lima',
        country: 'Peru',
      },
    ] as Testimonial[],
  },
};
