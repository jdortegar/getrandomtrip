import request from 'supertest';
import express from 'express';
import postPurchaseRoutes from '../routes/post-purchase';

const app = express();
app.use(express.json());
app.use('/api/post-purchase', postPurchaseRoutes);

describe('POST /api/post-purchase', () => {
  it('should return success for a valid booking confirmation', async () => {
    const res = await request(app)
      .post('/api/post-purchase')
      .send({
        bookingId: 'test_booking_id',
        status: 'confirmed',
        paymentId: 'test_payment_id',
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Confirmation recorded successfully.');
  });

  it('should return 400 if bookingId is missing', async () => {
    const res = await request(app)
      .post('/api/post-purchase')
      .send({
        status: 'confirmed',
        paymentId: 'test_payment_id',
      });

    expect(res.statusCode).toEqual(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Missing required confirmation details.');
  });

  it('should return 400 if status is missing', async () => {
    const res = await request(app)
      .post('/api/post-purchase')
      .send({
        bookingId: 'test_booking_id',
        paymentId: 'test_payment_id',
      });

    expect(res.statusCode).toEqual(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Missing required confirmation details.');
  });

  it('should return 400 if paymentId is missing', async () => {
    const res = await request(app)
      .post('/api/post-purchase')
      .send({
        bookingId: 'test_booking_id',
        status: 'confirmed',
      });

    expect(res.statusCode).toEqual(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Missing required confirmation details.');
  });
});