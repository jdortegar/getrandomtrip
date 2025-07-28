import { Router, Request, Response } from 'express';
import { MercadoPagoConfig, Preference } from 'mercadopago';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
});

// Placeholder for scheduleRevealEmail - this should be imported from scheduler.ts
const scheduleRevealEmail = (bookingId: string, tripDate: Date) => {
  console.log(`Scheduling reveal email for booking ${bookingId} on ${tripDate.toISOString()}`);
  // Actual implementation will be in scheduler.ts
};

router.post('/', async (req: Request, res: Response) => {
  const { amount, description, payerEmail } = req.body;

  if (!amount || !description || !payerEmail) {
    return res.status(400).json({ success: false, message: 'Missing required payment details: amount, description, or payerEmail.' });
  }

  try {
    const preference = {
      items: [
        {
          title: description,
          unit_price: Number(amount),
          quantity: 1,
          id: '1234', // Placeholder ID, replace with actual product ID if available
        },
      ],
      payer: {
        email: payerEmail,
      },
      back_urls: {
        success: `${process.env.FRONTEND_URL}/post-purchase?status=success`,
        pending: `${process.env.FRONTEND_URL}/post-purchase?status=pending`,
        failure: `${process.env.FRONTEND_URL}/post-purchase?status=failure`,
      },
      auto_return: 'approved_on_success',
      notification_url: `${process.env.BACKEND_URL}/webhooks/mercadopago`, // This will be a separate webhook endpoint
    };

    const response = await new Preference(client).create({
      body: preference
    });
    const { id, init_point } = response;

    // Persist the booking in the database
    const booking = await prisma.booking.create({
      data: {
        userId: 'clx000000000000000000000', // Placeholder: Replace with actual user ID from authentication context
        travelType: 'Family', // Placeholder
        experienceLevel: 'Essenza', // Placeholder: Replace with actual level from frontend
        originCity: 'Placeholder City', // Placeholder
        startDate: new Date(), // Placeholder
        travelerCount: 1, // Placeholder
        basePrice: Number(amount), // Use amount as basePrice for now
        filtersCost: 0, // Placeholder
        addonsCost: 0, // Placeholder
        premiumFilters: [], // Placeholder: Replace with actual filters from frontend
        selectedAddons: [], // Placeholder: Replace with actual add-ons from frontend
        totalPrice: Number(amount), // Use amount as totalPrice for now
        status: 'PENDING', // Initial status
        mercadoPagoPreferenceId: id,
      },
    });

    // Schedule reveal email using the actual booking ID
    const mockTripDate = new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)); // 7 days from now
    scheduleRevealEmail(booking.id, mockTripDate);

    res.status(200).json({ success: true, message: 'Payment preference created.', preferenceId: id, initPoint: init_point, bookingId: booking.id });

  } catch (error: any) {
    console.error('Error creating Mercado Pago preference:', error.message);
    res.status(500).json({ success: false, message: 'Failed to create payment preference.', error: error.message });
  }
});

export default router;