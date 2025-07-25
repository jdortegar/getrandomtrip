import { Router, Request, Response } from 'express';
import mercadopago from 'mercadopago';
import { scheduleRevealEmail } from '../scheduler'; // Import the scheduler

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  const { type, data } = req.body;

  if (type === 'payment') {
    const paymentId = data.id;
    try {
      const payment = await mercadopago.payment.findById(Number(paymentId));
      const status = payment.body.status;
      const externalReference = payment.body.external_reference; // This could be your booking ID

      console.log(`Mercado Pago Payment Notification: Payment ID ${paymentId}, Status: ${status}, External Reference: ${externalReference}`);

      // Handle different payment statuses
      switch (status) {
        case 'approved':
          console.log('Payment approved!');
          // In a real application, you would fetch the actual tripDate associated with the externalReference (bookingId)
          // For now, using a placeholder date (e.g., 7 days from now)
          const mockTripDate = new Date(Date.now() + (7 * 24 * 60 * 60 * 1000));
          if (externalReference) {
            scheduleRevealEmail(externalReference, mockTripDate);
          } else {
            console.warn('No externalReference found for approved payment. Cannot schedule reveal email.');
          }
          break;
        case 'pending':
          console.log('Payment pending.');
          break;
        case 'rejected':
          console.log('Payment rejected.');
          break;
        default:
          console.log(`Unhandled payment status: ${status}`);
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