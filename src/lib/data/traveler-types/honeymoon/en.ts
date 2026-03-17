import type { TravelerTypeData } from '@/types/traveler-type';
import type { HeroContent } from '@/components/Hero';
import type { ParagraphContent } from '@/components/Paragraph';
import type { TypePlannerContent } from '@/types/planner';
import type { BlogPost, BlogViewAll } from '@/lib/data/shared/blog-types';
import type { Testimonial } from '@/lib/data/shared/testimonial-types';
import { getExcusesByType } from '@/lib/helpers/excuse-helper';

export const honeymoonEn: TravelerTypeData = {
  meta: {
    slug: 'honeymoon',
    label: 'Honeymoon',
    aliases: ['luna-de-miel'],
    pageTitle: 'Honeymoon | Randomtrip',
  },
  content: {
    hero: {
      title: 'Nuptia© Randomtrip',
      subtitle:
        'The honeymoon isn\'t a destination—it\'s the first chapter of your life together. We design the surprise; you live it.',
      tagline: 'The beginning of a unique story',
      scrollText: 'SCROLL',
      videoSrc: '/videos/honeymoon-video.mp4',
      fallbackImage: '/images/journey-types/honeymoon-same-sex.jpg',
      primaryCta: {
        ariaLabel: 'Go to blog section',
        href: '#blog',
        text: 'Inspiring stories',
      },
      secondaryCta: {
        ariaLabel: 'Start your honeymoon',
        href: '#type-planner',
        text: 'RANDOMTRIP-us!',
      },
    } as HeroContent,
    story: {
      title: 'The invisible beginning no one else will see',
      paragraphs: [
        'The wedding was just a rite, a moment when love went public. But the honeymoon… the honeymoon is the private instant when two gazes find each other with no witnesses.',
        'There are no precise coordinates for that trip. Because what matters isn\'t the place you reach, but what each step reveals about the other. An unexpected laugh in the middle of a walk, a shared silence by the sea, the certainty that someone is with us even when we say nothing.',
        'We set the stage; you\'ll write the invisible script no one else can repeat. Because some trips end when you return, and others—the real ones—begin when we understand that the destination is, in fact, the bond we build every day. The honeymoon isn\'t the epilogue of a party. It\'s the prologue of a story that\'s just beginning.',
      ],
      eyebrow: 'The first chapter',
    } as ParagraphContent,
  },
  planner: {
    title: 'Design your Honeymoon Randomtrip',
    subtitle: 'Three steps to start your life together in the best way.',
    levels: [
      {
        id: 'essenza',
        maxNights: 2,
        name: 'Essenza',
        subtitle: 'The essentials with style',
        price: 350,
        priceLabel: 'Up to',
        priceFootnote: 'per person',
        features: [
          { title: 'Duration', description: 'Max 2 nights' },
          { title: 'Destinations', description: 'Domestic cities' },
          {
            title: 'Transport',
            description: 'Low cost (buses or off-peak flights).',
            footnote: 'Seat selection, carry-on and checked baggage not included.',
          },
          { title: 'Dates', description: 'Limited availability, with restrictions and blackouts.' },
          { title: 'Accommodation', description: 'Midscale (3★ or equivalent).' },
          { title: 'Extras', description: 'Essential destination guide.' },
          { title: 'Benefits', description: 'Not included' },
        ],
        closingLine: 'Perfect for a quick, affordable escape.',
        ctaLabel: 'Choose Essenza →',
        excuses: getExcusesByType('honeymoon'),
      },
      {
        id: 'explora',
        maxNights: 4,
        name: 'Explora Mode',
        subtitle: 'Adventure without limits',
        price: 650,
        priceLabel: 'Up to',
        priceFootnote: 'per person',
        features: [
          { title: 'Duration', description: 'Up to 4 nights' },
          { title: 'Destinations', description: 'Domestic + Regional' },
          { title: 'Transport', description: 'Economy with upgrade options.' },
          { title: 'Dates', description: 'More flexibility, some restrictions.' },
          { title: 'Accommodation', description: 'Midscale+ (3-4★ or equivalent).' },
          { title: 'Extras', description: 'Destination guide + 1 experience included.' },
          { title: 'Benefits', description: '24/7 support' },
        ],
        closingLine: 'Ideal for exploring beyond the obvious.',
        ctaLabel: 'Choose Explora Mode →',
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
        maxNights: 7,
        name: 'Explora+',
        subtitle: 'Premium experience',
        price: 1200,
        priceLabel: 'Up to',
        priceFootnote: 'per person',
        features: [
          { title: 'Duration', description: 'Up to 7 nights' },
          { title: 'Destinations', description: 'International + Premium domestic' },
          { title: 'Transport', description: 'Premium with full comfort.' },
          { title: 'Dates', description: 'Maximum flexibility, no restrictions.' },
          { title: 'Accommodation', description: 'Luxury (5★ or equivalent).' },
          { title: 'Extras', description: 'Personalized guide + exclusive experiences.' },
          { title: 'Benefits', description: '24/7 concierge + automatic upgrades' },
        ],
        closingLine: 'For those seeking the best of the best.',
        ctaLabel: 'Choose Explora+ →',
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
        subtitle: 'Adventure without limits',
        price: 1200,
        priceLabel: 'Up to',
        priceFootnote: 'per person',
        features: [
          { title: 'Duration', description: 'Up to 5 nights' },
          { title: 'Destinations', description: 'All Americas (no limits)' },
          { title: 'Transport', description: 'Multimodal with comfort prioritized.' },
          { title: 'Dates', description: 'No blackouts.' },
          { title: 'Accommodation', description: 'Upper-upscale.' },
          { title: 'Extras', description: 'Personalized guide + exclusive experiences.' },
          { title: 'Benefits', description: '24/7 concierge + automatic upgrades' },
        ],
        closingLine: 'For those seeking the best of the best.',
        ctaLabel: 'Choose Bivouac →',
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
        subtitle: 'Love made to measure',
        price: 1800,
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
        closingLine:
          'An unrepeatable trip, designed as the prologue of a story that\'s just beginning.',
        ctaLabel: 'Create the extraordinary →',
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
    title: 'Unforgettable honeymoon stories',
    subtitle: 'The perfect beginning for your life together.',
    posts: [
      {
        href: '/blogs/honeymoon',
        image: 'https://images.unsplash.com/photo-1519741497674-611481863552',
        category: 'Romance',
        title: 'The most romantic honeymoon destinations',
      },
      {
        href: '/blogs/honeymoon',
        image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e',
        category: 'Tips',
        title: 'How to plan the perfect honeymoon',
      },
      {
        href: '/blogs/honeymoon',
        image: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd',
        category: 'Experiences',
        title: 'Our surprise honeymoon in Tuscany',
      },
      {
        href: '/blogs/honeymoon',
        image: 'https://images.unsplash.com/photo-1543248939-ff40856f65d4',
        category: 'Guides',
        title: 'Romantic activities for newlyweds',
      },
      {
        href: '/blogs/honeymoon',
        image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470',
        category: 'Adventure',
        title: 'Honeymoon with adrenaline',
      },
      {
        href: '/blogs/honeymoon',
        image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800',
        category: 'Culture',
        title: 'Unique experiences to start together',
      },
    ] as BlogPost[],
    viewAll: {
      title: 'View all stories',
      subtitle: 'Go to Blog',
      href: '/blogs/honeymoon',
    } as BlogViewAll,
  },
  testimonials: {
    title: 'What our newlywed couples say',
    items: [
      {
        quote: 'The perfect honeymoon. Everything was magical from the first moment.',
        author: 'María & Juan',
        country: 'Argentina',
      },
      {
        quote: 'Every detail thought for us. Unforgettable.',
        author: 'Laura & Pablo',
        country: 'Spain',
      },
      {
        quote: 'Exceeded our expectations. We started our life together in the best way.',
        author: 'Ana & Diego',
        country: 'Spain',
      },
      {
        quote: 'Romantic, surprising and perfect. Thank you for so much.',
        author: 'Sofia & Miguel',
        country: 'Spain',
      },
      {
        quote: 'A start to marriage we will never forget.',
        author: 'Carmen & Roberto',
        country: 'Spain',
      },
      {
        quote: 'The most romantic experience we have lived together.',
        author: 'Isabel & Fernando',
        country: 'Spain',
      },
    ] as Testimonial[],
  },
};
