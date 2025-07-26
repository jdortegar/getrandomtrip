import request from 'supertest';
import express from 'express';
import checkoutRoutes from '../routes/checkout';

const app = express();
app.use(express.json());
app.use('/api/checkout', checkoutRoutes);

// Mock PrismaClient
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    booking: {
      create: jest.fn(() => Promise.resolve({ id: 'mock_booking_id' })),
      update: jest.fn(),
    },
  })),
}));

// Mock scheduleRevealEmail
jest.mock('../scheduler', () => ({
  scheduleRevealEmail: jest.fn(),
}));

describe('POST /api/checkout', () => {
  it('should create a Mercado Pago preference and a booking', async () => {
    const res = await request(app)
      .post('/api/checkout')
      .send({
        amount: 100,
        description: 'Test Trip',
        payerEmail: 'test@example.com',
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.preferenceId).toBe('mock_preference_id');
    expect(res.body.initPoint).toBe('mock_init_point');
    expect(res.body).toHaveProperty('bookingId');
  });

  it('should return 400 if required fields are missing', async () => {
    const res = await request(app)
      .post('/api/checkout')
      .send({
        amount: 100,
        description: 'Test Trip',
      });

    expect(res.statusCode).toEqual(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Missing required payment details: amount, description, or payerEmail.');
  });
});