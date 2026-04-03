import { Router } from 'express';
import {
  activateHourlyCoverage,
  deactivateHourlyCoverage,
  getMyPolicies,
  getPolicyById,
  pausePolicy,
  purchasePolicy,
} from '../controllers/policy.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

router.use(protect);

router.post('/', purchasePolicy);
router.get('/my', getMyPolicies);
router.get('/:id', getPolicyById);

// F-01 — Hourly coverage
router.post('/hourly/activate', activateHourlyCoverage);
router.patch('/hourly/deactivate', deactivateHourlyCoverage);

// F-07 — Smart Pause
router.patch('/:id/pause', pausePolicy);

export default router;
