import { Router } from 'express';

const router = Router();

router.post('/', (req, res) => {
  const { bookingId } = req.body;

  if (bookingId) {
    // In a real application, this would record the confirmation in the database
    // and potentially trigger other post-purchase flows.
    console.log(`Booking ${bookingId} confirmed.`);
    res.status(200).json({ success: true, message: `Booking ${bookingId} confirmed.` });
  } else {
    res.status(400).json({ success: false, message: 'Booking ID is required.' });
  }
});

export default router;
