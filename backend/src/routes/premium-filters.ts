import { Router, Request, Response } from 'express';
import { listPremiumFilters } from '../usecases/list-premium-filters';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const filters = await listPremiumFilters();
    res.status(200).json(filters);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching premium filters', error: error.message });
  }
});

export default router;
