import { Router } from 'express';

const router = Router();

router.post('/', (req, res) => {
  const { amount, paymentMethod } = req.body;

  // Simulate payment processing
  if (amount > 0 && paymentMethod === 'Mercado Pago') {
    const success = Math.random() > 0.1; // 90% chance of success
    if (success) {
      res.status(200).json({ success: true, message: 'Payment successful!', transactionId: 'mock_txn_12345' });
    } else {
      res.status(400).json({ success: false, message: 'Payment failed. Please try again.' });
    }
  } else {
    res.status(400).json({ success: false, message: 'Invalid payment details.' });
  }
});

export default router;
