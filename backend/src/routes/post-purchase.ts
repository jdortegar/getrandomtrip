import { Router, Request, Response } from 'express';

const router = Router();

router.post('/', (req: Request, res: Response) => {
  // Mock recording of confirmation
  const { bookingId, status, paymentId } = req.body;

  if (!bookingId || !status || !paymentId) {
    return res.status(400).json({ success: false, message: 'Missing required confirmation details.' });
  }

  console.log(`Recording confirmation for booking ${bookingId} with status ${status} and payment ID ${paymentId}`);
  res.status(200).json({ success: true, message: 'Confirmation recorded successfully.' });
});

export default router;