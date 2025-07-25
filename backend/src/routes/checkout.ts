import { Router, Request, Response } from 'express';
import mercadopago from 'mercadopago';

const router = Router();

// Configure Mercado Pago SDK
mercadopago.configure({
  access_token: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
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

    const response = await mercadopago.preferences.create(preference);
    const { id, init_point } = response.body;

    // Simulate booking creation and scheduling of reveal email
    const mockBookingId = 'mock_booking_abcde'; // In a real app, this would come from your booking service
    const mockTripDate = new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)); // 7 days from now
    scheduleRevealEmail(mockBookingId, mockTripDate);

    res.status(200).json({ success: true, message: 'Payment preference created.', preferenceId: id, initPoint: init_point });

  } catch (error: any) {
    console.error('Error creating Mercado Pago preference:', error.message);
    res.status(500).json({ success: false, message: 'Failed to create payment preference.', error: error.message });
  }
});

export default router;