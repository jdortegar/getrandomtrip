import { Router } from 'express';

const router = Router();

router.post('/', (req, res) => {
  const { bookingId } = req.body;

  if (bookingId) {
    // In a real application, this would retrieve the destination details
    // associated with the bookingId and send them to the frontend.
    console.log(`Revealing destination for booking ${bookingId}.`);
    res.status(200).json({ success: true, message: `Destination revealed for booking ${bookingId}.`, destination: 'Mock Destination' });
  } else {
    res.status(400).json({ success: false, message: 'Booking ID is required.' });
  }
});

export default router;
