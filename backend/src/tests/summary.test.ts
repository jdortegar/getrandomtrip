import request from 'supertest';
import express from 'express';
import summaryRoutes from '../routes/summary';

const app = express();
app.use(express.json());
app.use('/api/summary', summaryRoutes);

describe('POST /api/summary', () => {
  it('should return a trip summary with calculated prices', async () => {
    const mockConfig = {
      experienceLevel: 'Explora+',
      basicConfig: {
        originCity: 'Buenos Aires',
        travelDate: '2025-08-15',
        nights: 7,
        travelers: 2,
        accommodationType: 'hotel',
        transportationType: 'flights',
      },
      premiumFilters: ['filter1', 'filter2'],
      addOns: ['addon1', 'addon2'],
    };

    const res = await request(app)
      .post('/api/summary')
      .send(mockConfig);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty('summary');
    expect(res.body.summary.experienceLevel).toBe(mockConfig.experienceLevel);
    expect(res.body.summary.basicConfig).toEqual(mockConfig.basicConfig);
    expect(res.body.summary.premiumFilters).toEqual(mockConfig.premiumFilters);
    expect(res.body.summary.addOns).toEqual(mockConfig.addOns);
    expect(res.body.summary).toHaveProperty('basePrice');
    expect(res.body.summary).toHaveProperty('premiumFilterCost');
    expect(res.body.summary).toHaveProperty('addOnsCost');
    expect(res.body.summary).toHaveProperty('totalPrice');
  });

  it('should return a trip summary with zero costs if no filters or add-ons', async () => {
    const mockConfig = {
      experienceLevel: 'Explora+',
      basicConfig: {
        originCity: 'Buenos Aires',
        travelDate: '2025-08-15',
        nights: 7,
        travelers: 1,
        accommodationType: 'hotel',
        transportationType: 'flights',
      },
      premiumFilters: [],
      addOns: [],
    };

    const res = await request(app)
      .post('/api/summary')
      .send(mockConfig);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.summary.premiumFilterCost).toBe(0);
    expect(res.body.summary.addOnsCost).toBe(0);
  });
});