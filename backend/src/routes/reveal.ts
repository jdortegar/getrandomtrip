import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.post('/', async (req: Request, res: Response) => {
  const { bookingId } = req.body;

  if (!bookingId) {
    return res.status(400).json({ success: false, message: 'Missing bookingId.' });
  }

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    // In a real application, the destination would be determined based on the booking details.
    // For now, we'll return a mock destination based on the booking ID.
    const mockDestination = {
      name: 'Kyoto, Japan',
      image: '/images/kyoto.jpg',
      description: 'Discover ancient temples, beautiful gardens, and traditional geisha districts.',
      itinerary: [
        'Day 1: Arrive in Kyoto, check into ryokan, explore Gion district.',
        'Day 2: Visit Fushimi Inari Shrine and Arashiyama Bamboo Grove.',
        'Day 3: Explore Kinkaku-ji (Golden Pavilion) and Ryoan-ji (Zen garden).',
        'Day 4: Day trip to Nara to see Todai-ji Temple and deer park.',
      ],
    };

    res.status(200).json({ success: true, destination: mockDestination });

  } catch (error: any) {
    console.error('Error revealing destination:', error.message);
    res.status(500).json({ success: false, message: 'Failed to reveal destination.', error: error.message });
  }
});

export default router;