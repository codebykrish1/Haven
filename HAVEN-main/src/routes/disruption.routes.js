import { Router } from 'express';
import {
  createDisruptionEvent,
  getAllDisruptions,
  getDisruptionById,
} from '../controllers/disruption.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

// GET routes — protected (any logged in worker can view)
router.get('/', protect, getAllDisruptions);
router.get('/:id', protect, getDisruptionById);

// POST — in production this would be admin/system only
// For prototype, any authenticated user can trigger it
router.post('/', protect, createDisruptionEvent);

export default router;
