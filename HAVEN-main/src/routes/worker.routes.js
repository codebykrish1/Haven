import { Router } from 'express';
import {
  getBadges,
  getDashboard,
  getIncomeCalendar,
  getProfile,
  updateProfile,
} from '../controllers/worker.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

router.use(protect);

// GET /api/workers/profile
router.get('/profile', getProfile);

// PATCH /api/workers/profile
router.patch('/profile', updateProfile);

// GET /api/workers/dashboard
router.get('/dashboard', getDashboard);

// F-06 — Income Calendar
router.get('/calendar', getIncomeCalendar);

// F-08 — Dignity Score / Badges
router.get('/badges', getBadges);

export default router;
