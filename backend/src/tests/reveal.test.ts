import request from 'supertest';
import express from 'express';
import revealRoutes from '../routes/reveal';

// Mock PrismaClient
jest.mock('@prisma/client', () => {
  const mockBooking = {
    findUnique: jest.fn(),
  };
  return {
    PrismaClient: jest.fn(() => ({
      booking: mockBooking,
    })),
  };
});

const app = express();
app.use(express.json());
app.use('/api/reveal', revealRoutes);

describe('POST /api/reveal', () => {
  let mockFindUnique: jest.Mock;

  beforeEach(() => {
    const { PrismaClient } = require('@prisma/client');
    const prismaInstance = new PrismaClient();
    mockFindUnique = prismaInstance.booking.findUnique;
    mockFindUnique.mockClear(); // Clear mocks before each test
  });

  it('should return destination data for a valid bookingId', async () => {
    mockFindUnique.mockResolvedValueOnce({
      id: 'test_booking_id',
      // Add other booking properties as needed for the mock
    });

    const res = await request(app)
      .post('/api/reveal')
      .send({
        bookingId: 'test_booking_id',
      });

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty('destination');
    expect(res.body.destination.name).toBe('Kyoto, Japan');
  });

  it('should return 400 if bookingId is missing', async () => {
    const res = await request(app)
      .post('/api/reveal')
      .send({});

    expect(res.statusCode).toEqual(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Missing bookingId.');
  });

  it('should return 404 if booking is not found', async () => {
    mockFindUnique.mockResolvedValueOnce(null);

    const res = await request(app)
      .post('/api/reveal')
      .send({
        bookingId: 'non_existent_booking_id',
      });

    expect(res.statusCode).toEqual(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Booking not found.');
  });
});