import { Router, Request, Response } from 'express';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { PrismaClient, BookingStatus } from '@prisma/client'; // Import BookingStatus enum
import { scheduleRevealEmail } from '../scheduler'; // Import the scheduler

const router = Router();
const prisma = new PrismaClient();

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || '',
});

router.post('/', async (req: Request, res: Response) => {
  const { type, data } = req.body;

  if (type === 'payment') {
    const paymentId = data.id;
    try {
      const payment = await new Payment(client).get({ id: Number(paymentId) });
      const status = payment.status;
      const externalReference = payment.external_reference; // This could be your booking ID

      console.log(`Mercado Pago Payment Notification: Payment ID ${paymentId}, Status: ${status}, External Reference: ${externalReference}`);

      let bookingStatus: BookingStatus = BookingStatus.PENDING; // Initialize with a default enum value
      switch (status) {
        case 'approved':
          bookingStatus = BookingStatus.CONFIRMED;
          console.log('Payment approved!');
          // In a real application, you would fetch the actual tripDate associated with the externalReference (bookingId)
          // For now, using a placeholder date (e.g., 7 days from now)
          const mockTripDate = new Date(Date.now() + (7 * 24 * 60 * 60 * 1000));
          if (externalReference) {
            scheduleRevealEmail(externalReference, mockTripDate);
          }
          break;
        case 'pending':
          bookingStatus = BookingStatus.PENDING;
          console.log('Payment pending.');
          break;
        case 'rejected':
          bookingStatus = BookingStatus.CANCELLED;
          console.log('Payment rejected.');
          break;
        default:
          bookingStatus = BookingStatus.PENDING; // Default to PENDING for unhandled statuses
          console.log(`Unhandled payment status: ${status}`);
      }

      if (externalReference) {
        await prisma.booking.updateMany({
          where: { mercadoPagoPreferenceId: externalReference },
          data: { status: bookingStatus },
        });
        console.log(`Booking with preference ID ${externalReference} status updated to ${bookingStatus}`);
      } else {
        console.warn('No externalReference found for payment. Cannot update booking status.');
      }

      res.status(200).send('Webhook received');
    } catch (error: any) {
      console.error('Error processing Mercado Pago webhook:', error.message);
      res.status(500).send('Error processing webhook');
    }
  } else {
    console.log(`Unhandled webhook type: ${type}`);
    res.status(200).send('Webhook received (unhandled type)');
  }
});

export default router;