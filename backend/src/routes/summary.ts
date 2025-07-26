import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.post('/', async (req: Request, res: Response) => {
  // In a real application, you would receive the configuration data from the frontend
  // and calculate the actual pricing based on your business logic and database.
  const { experienceLevel, basicConfig, premiumFilters, addOns } = req.body;

  // Mock pricing calculation for now
  const basePrice = 1000; // Example base price
  const premiumFilterCost = premiumFilters.length * 50; // Example cost per filter
  const addOnsCost = addOns.length * 30 * basicConfig.travelers; // Example cost per add-on per traveler
  const totalPrice = basePrice + premiumFilterCost + addOnsCost;

  const summary = {
    experienceLevel,
    basicConfig,
    premiumFilters,
    addOns,
    basePrice,
    premiumFilterCost,
    addOnsCost,
    totalPrice,
  };

  res.status(200).json({ success: true, summary });
});

export default router;