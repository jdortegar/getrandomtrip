import type { TravelerTypeData } from '@/types/traveler-type';
import type { TypePlannerContent } from '@/types/planner';
import type { BlogPost, BlogViewAll } from '@/lib/data/shared/blog-types';
import type { Testimonial } from '@/lib/data/shared/testimonial-types';
import { getExcusesByType } from '@/lib/helpers/excuse-helper';

export const soloEn: TravelerTypeData = {
  meta: {
    slug: 'solo',
    label: 'Solo',
    aliases: [],
    pageTitle: 'Solo | Randomtrip',
  },
  content: {
    hero: {
      title: 'SOLUM© RANDOMTRIP',
      subtitle:
        'Your trip, your rules. Discover unique destinations designed for the freedom of traveling alone.',
      tagline: 'Personal adventure. No commitments.',
      scrollText: 'SCROLL',
      videoSrc: '/videos/hero-solo-video.mp4',
      fallbackImage: '/images/fallbacks/hero-solo-video.jpg',
      primaryCta: {
        ariaLabel: 'Go to blog section',
        href: '#blog',
        text: 'Inspiring stories',
      },
      secondaryCta: {
        ariaLabel: 'Go to trip planning section',
        href: '#type-planner',
        text: 'RANDOMTRIP-ME!',
      },
    },
    story: {
      title: 'Freedom in its purest form',
      paragraphs: [
        'When you travel alone, you answer to no one: not a partner who wants to stop at every viewpoint, nor a friend who plans itineraries in color.',
        'There will be no "things to do" lists, no five-star TripAdvisor reviews with pixelated photos. There will be a path opening in front of you, as if you were inventing it with every step. And, in the background, someone—us—making sure everything works even when it feels improvised.',
        "Maybe you'll wake up looking at a lake you didn't know existed. Or end up talking to strangers who, after a while, won't feel like strangers. Traveling alone is that rare luxury: finding yourself in the silence and discovering it's not so scary.",
        'What begins is a story without witnesses: a coffee going cold while you write in a notebook, a walk that forces you to think differently, a photo you have no one to show but keep anyway.',
        "The only certainty is that you'll come back different. Not better or worse: different. And wanting to do it again, like that book you reread knowing you'll understand it better the second time.",
      ],
      eyebrow: 'Solo, but never alone',
    },
  },
  planner: {
    eyebrow: 'Design your solo Randomtrip',
    title: 'three simple steps',
    subtitle: 'for an adventure only you will tell.',
    levels: [
      {
        id: 'essenza',
        maxNights: 2,
        name: 'Essenza',
        subtitle: 'The essentials with style',
        price: 450,
        priceLabel: 'Up to',
        priceFootnote: 'per person',
        features: [
          { title: 'Duration', description: 'Max. 2 nights (Quick escape)' },
          { title: 'Destinations', description: 'Domestic cities' },
          {
            title: 'Transport',
            description: 'Land / Low cost (Practical arrival)',
          },
          {
            title: 'Accommodation',
            description: 'Comfort (3★) - Functional and stylish',
          },
          {
            title: 'Benefits',
            description: 'Essential guide to get around with no hassle.',
          },
        ],
        closingLine:
          'A short escape to lose yourself in the simple and find yourself in the unexpected.',
        ctaLabel: 'Start your Essenza',
        excuses: getExcusesByType('solo'),
      },
      {
        id: 'explora',
        maxNights: 3,
        name: 'Explora Mode',
        subtitle: 'Active and flexible',
        price: 650,
        priceLabel: 'Up to',
        priceFootnote: 'per person',
        features: [
          {
            title: 'Duration',
            description: 'Max 3 nights (+More flexibility)',
          },
          {
            title: 'Destinations',
            description: 'Domestic+ (Farther & regional)',
          },
          { title: 'Transport', description: 'Basic flights (Carry-on only)' },
          {
            title: 'Accommodation',
            description: '+ Style (3-4★) - Elevate your stay',
          },
          {
            title: 'Benefits',
            description:
              'Randomtrip guide designed to discover at your own pace.',
          },
        ],
        closingLine:
          'Designed for those who travel light and want to discover without a script.',
        ctaLabel: 'Activate Explora Mode',
        excuses: getExcusesByType('solo'),
      },
      {
        id: 'exploraPlus',
        maxNights: 4,
        name: 'Explora+',
        subtitle: 'More layers, more moments',
        price: 1100,
        priceLabel: 'Up to',
        priceFootnote: 'per person',
        features: [
          {
            title: 'Duration',
            description: 'Max 4 nights (+Long weekends & holidays)',
          },
          {
            title: 'Destinations',
            description: '+ Continental (New frontiers)',
          },
          {
            title: 'Transport',
            description: 'Classic flights (Standard luggage)',
          },
          {
            title: 'Accommodation',
            description: '+ Premium (4★) - Upscale & boutique',
          },
          {
            title: 'Benefits',
            description:
              '1 curated solo experience + Destination Decoded guide, so each day is a curated surprise.',
          },
        ],
        closingLine:
          'More nights, more unexpected encounters, and more reasons to come back different.',
        ctaLabel: 'Level up',
        excuses: getExcusesByType('solo'),
      },
      {
        id: 'bivouac',
        maxNights: 5,
        name: 'Bivouac',
        subtitle: 'Total disconnection',
        price: 1550,
        priceLabel: 'Up to',
        priceFootnote: 'per person',
        features: [
          {
            title: 'Duration',
            description: 'Max 5 nights (No restrictions)',
          },
          {
            title: 'Destinations',
            description: '+ Intercontinental (Dream destinations)',
          },
          {
            title: 'Transport',
            description: 'Full flights (Maximum comfort)',
          },
          {
            title: 'Accommodation',
            description: '+ Upper-scale (4-5★) - Design and service',
          },
          {
            title: 'Benefits',
            description:
              '1 premium experience + exclusive perks (e.g. late check-out, upgrade, amenities) + Destination Decoded guide, curated by our Tripper Travel Advisors, with tips few know.',
          },
        ],
        closingLine:
          'An intimate trip, cared for in detail, that turns solitude into a personal luxury.',
        ctaLabel: 'Travel different',
        excuses: getExcusesByType('solo'),
      },
      {
        id: 'atelier',
        maxNights: 7,
        name: 'Atelier Getaway',
        subtitle: 'Distinction, effortless',
        price: 1550,
        priceLabel: 'From',
        priceFootnote: 'per person',
        features: [
          {
            title: 'Duration',
            description: '100% flexible (No limit on days)',
          },
          {
            title: 'Destinations',
            description: 'Global (The world within reach)',
          },
          {
            title: 'Transport',
            description: 'Flex / Premium / Private (Made to measure)',
          },
          {
            title: 'Accommodation',
            description: 'High-end & author hotels (Curated selection)',
          },
          {
            title: 'Benefits',
            description:
              'Trip co-creation with a Tripper Travel Advisor + 24/7 support team.',
          },
        ],
        closingLine:
          'A blank canvas to create the getaway no one else will be able to repeat.',
        ctaLabel: 'Create the unrepeatable',
        excuses: getExcusesByType('solo'),
      },
    ],
  } as TypePlannerContent,
  blog: {
    title: 'Our favorite destinations for solo travel',
    subtitle:
      "The solo path doesn't mean being alone. These stories and destinations show that getting lost is another way of finding yourself.",
    posts: [
      {
        href: '/blog/solo',
        image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828',
        category: 'Independence',
        title: 'Traveling Solo: The Best Decision You Can Make',
      },
      {
        href: '/blog/solo',
        image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4',
        category: 'Safety',
        title: 'Safety Tips for Solo Travelers',
      },
      {
        href: '/blog/solo',
        image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800',
        category: 'Destinations',
        title: 'The Best Destinations for Your First Solo Trip',
      },
      {
        href: '/blog/solo',
        image: 'https://images.unsplash.com/photo-1539635278303-d4002c07eae3',
        category: 'Budget',
        title: 'How to Travel Solo Without Overspending',
      },
      {
        href: '/blog/solo',
        image: 'https://images.unsplash.com/photo-1527631746610-bca00a040d60',
        category: 'Experiences',
        title: 'Meeting People Along the Way',
      },
      {
        href: '/blog/solo',
        image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1',
        category: 'Inspiration',
        title: 'The Art of Traveling Solo',
      },
    ] as BlogPost[],
    viewAll: {
      title: 'View all stories',
      subtitle: 'More solo adventures',
      href: '/blog/solo',
    } as BlogViewAll,
  },
  testimonials: {
    title: 'What our solo travelers say',
    items: [
      {
        quote:
          'My first solo trip and I felt accompanied by flawless organization. I came back different.',
        author: 'Martín S.',
        country: 'Argentina',
      },
      {
        quote:
          "The surprise was a gift. I found places and people I didn't expect.",
        author: 'Camila R.',
        country: 'Uruguay',
      },
      {
        quote:
          'Flexible and safe itinerary. I could move at my own pace without missing the essentials.',
        author: 'Diego P.',
        country: 'Chile',
      },
      {
        quote:
          'I dared to try new things. Great balance between activity and calm.',
        author: 'Luisa G.',
        country: 'Argentina',
      },
      {
        quote:
          'The curation made me feel like the protagonist of the trip, not a spectator.',
        author: 'Tomás L.',
        country: 'Argentina',
      },
      {
        quote:
          "I discovered that traveling alone doesn't mean feeling alone. Great experience.",
        author: 'Paula F.',
        country: 'Peru',
      },
    ] as Testimonial[],
  },
};
