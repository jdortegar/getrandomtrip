import type { TravelerTypeData } from '@/types/traveler-type';
import type { HeroContent } from '@/components/Hero';
import type { ParagraphContent } from '@/components/Paragraph';
import type { TypePlannerContent } from '@/types/planner';
import type { BlogPost, BlogViewAll } from '@/lib/data/shared/blog-types';
import type { Testimonial } from '@/lib/data/shared/testimonial-types';
import { getExcusesByType } from '@/lib/helpers/excuse-helper';

export const coupleEn: TravelerTypeData = {
  meta: {
    slug: 'couple',
    label: 'Couple',
    aliases: ['parejas', 'pareja', 'couples'],
    pageTitle: 'Couple | Randomtrip',
  },
  content: {
    hero: {
      title: 'Bond© Randomtrip',
      subtitle:
        'Your trip should be as unique as you are. Discover secret destinations together.',
      tagline: 'Surprise for the two of you. No spoilers.',
      scrollText: 'SCROLL',
      videoSrc:
        'https://ocqketmaavn5dczt.public.blob.vercel-storage.com/videos/couple-hero-video.mp4',
      fallbackImage: '/images/journey-types/couple-traveler.jpg',
      primaryCta: {
        ariaLabel: 'Go to blog section',
        href: '#blog',
        text: 'Inspiring stories',
      },
      secondaryCta: {
        ariaLabel: 'Go to trip planning section',
        href: '#type-planner',
        text: 'RANDOMTRIP-us!',
      },
    } as HeroContent,
    story: {
      title: 'Classified love',
      paragraphs: [
        'No one will know where you\'ll be. Not even you… yet. And trust me: that\'s a good thing. Because if something kills the magic of a trip, it\'s that Excel spreadsheet of schedules put together by the cousin who "knows how to organize."',
        'There will be no Excel here, no agency brochures with people smiling falsely. Someone—not you—will take care of everything so it feels improvised. You, meanwhile, won\'t know if the next morning you\'ll wake up to the sea or to roosters… and that, lovebirds, is art.',
        'No map marks it. No blog recommends it. Just the two of you, walking through places that will feel made up so no one else can see them. A locked itinerary, like grandma\'s recipes that she swears she\'ll take to the grave… and then ends up sharing at a wedding.',
        'Your names will be on the reservation. The destination won\'t. And that\'s when the story begins: breakfast here, a kiss there, a sunset you didn\'t ask for but you\'ll take as a memory. The only certainty is that you\'ll come back with stories that are impossible to explain without gestures and without exaggerating… and wanting to do it again, like when a song we love ends and you hit "repeat."',
      ],
      eyebrow: 'Two on the move',
    } as ParagraphContent,
  },
  planner: {
    title: 'Design your Randomtrip as a couple',
    subtitle:
      'Three simple steps to live a story no one else will be able to tell.',
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
          { title: 'Destinations', description: 'Domestic destinations' },
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
            description: 'General destination guide',
          },
        ],
        closingLine:
          'A short escape, enough to see each other differently and remember why it all started.',
        ctaLabel: 'Take the first step',
        excuses: getExcusesByType('couple'),
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
          {
            title: 'Duration',
            description: 'Max 3 nights (+More flexibility)',
          },
          {
            title: 'Destinations',
            description: 'Domestic+ (Farther & regional)',
          },
          {
            title: 'Transport',
            description: 'Basic flights (Carry-on only)',
          },
          {
            title: 'Accommodation',
            description: '+ Style (3-4★) - Elevate your stay',
          },
          {
            title: 'Benefits',
            description:
              'Randomtrip destination guide, designed to discover together',
          },
        ],
        closingLine:
          'For those who believe the best way to fall in love is to get lost and find each other again.',
        ctaLabel: 'Explore your story',
        excuses: getExcusesByType('couple'),
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
              '1 experience included + Destination Decoded guide (personalized guide so each day is a curated surprise)',
          },
        ],
        closingLine:
          'More nights, more surprises, more excuses to collect memories for two.',
        ctaLabel: 'Raise the stakes',
        excuses: getExcusesByType('couple'),
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
              '1 exclusive experience + perks (e.g. late check-out, upgrade, amenities) + Destination Decoded guide (curated by our Tripper Travel Advisors, with tips few know)',
          },
        ],
        closingLine:
          'A trip cared for like a relationship: with detail and patience.',
        ctaLabel: 'Travel differently',
        excuses: getExcusesByType('couple'),
      },
      {
        id: 'atelier',
        maxNights: 7,
        name: 'Atelier Getaway',
        subtitle: 'Love made to measure',
        price: 1200,
        priceLabel: 'From',
        priceFootnote: 'per person',
        features: [
          {
            title: 'Duration',
            description: '100% flexible (No limit on days)',
          },
          { title: 'Destinations', description: 'Global (The world within reach)' },
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
        excuses: getExcusesByType('couple'),
      },
    ],
  } as TypePlannerContent,
  blog: {
    title: 'Stories from adventurous couples',
    subtitle: 'Unique experiences only the two of you will live.',
    posts: [
      {
        href: '/blogs/couple',
        image: 'https://images.unsplash.com/photo-1526772662000-3f88f10405ff',
        category: 'Romance',
        title: '5 Reasons to Love a Surprise Trip as a Couple',
      },
      {
        href: '/blogs/couple',
        image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470',
        category: 'Tips',
        title: 'How to Pack for an Unknown Destination',
      },
      {
        href: '/blogs/couple',
        image: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1',
        category: 'Experiences',
        title: 'The Story of a Randomtrip to the Alps',
      },
      {
        href: '/blogs/couple',
        image: 'https://images.unsplash.com/photo-1539635278303-d4002c07eae3',
        category: 'Guides',
        title: 'Flavors of Southeast Asia',
      },
      {
        href: '/blogs/couple',
        image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800',
        category: 'Adventure',
        title: 'Along the Carretera Austral',
      },
      {
        href: '/blogs/couple',
        image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e',
        category: 'Inspiration',
        title: 'Hidden Beaches of Latin America',
      },
    ] as BlogPost[],
    viewAll: {
      title: 'More stories',
      subtitle: 'Discover all our adventures and unique experiences',
      href: '/blog',
    } as BlogViewAll,
  },
  testimonials: {
    title: 'What our couples say',
    items: [
      {
        author: 'María & Carlos',
        country: 'Argentina',
        quote:
          'It was the most incredible experience of our lives. We didn\'t know where we were going until 48 hours before, and it was perfect.',
      },
      {
        author: 'Ana & Diego',
        country: 'Spain',
        quote:
          'Randomtrip took us to places we would never have discovered on our own. A unique adventure.',
      },
      {
        author: 'Sofia & Miguel',
        country: 'Spain',
        quote:
          'The surprise was total. Every day was a new adventure. We\'ll definitely do it again.',
      },
      {
        author: 'Laura & Pablo',
        country: 'Spain',
        quote:
          'Amazing how they knew our tastes without us saying a word. The trip was perfect.',
      },
      {
        author: 'Carmen & Roberto',
        country: 'Spain',
        quote:
          'A unique experience that brought us even closer as a couple. Highly recommended.',
      },
      {
        author: 'Isabel & Fernando',
        country: 'Spain',
        quote:
          'Randomtrip exceeded all our expectations. A trip we\'ll remember forever.',
      },
    ] as Testimonial[],
  },
};
