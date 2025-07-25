import { Router, Request, Response } from 'express';

const router = Router();

router.post('/', (req: Request, res: Response) => {
  // Mock triggering of destination-reveal notification
  const { bookingId, destination } = req.body;

  if (!bookingId || !destination) {
    return res.status(400).json({ success: false, message: 'Missing required reveal details.' });
  }

  console.log(`Triggering reveal notification for booking ${bookingId} to destination ${destination}`);
  res.status(200).json({ success: true, message: 'Reveal notification triggered successfully.' });
});

export default router;