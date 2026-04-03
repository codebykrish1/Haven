import { Router } from 'express';
import {
  approveClaim,
  flagClaim,
  getClaimById,
  getMyClaims,
  payClaim,
  quickClaim,
} from '../controllers/claim.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

router.use(protect);

// GET /api/claims/my — worker sees their own claims
router.get('/my', getMyClaims);

// GET /api/claims/:id — single claim details
router.get('/:id', getClaimById);

// PATCH /api/claims/:id/approve — approve a pending claim
router.patch('/:id/approve', approveClaim);

// PATCH /api/claims/:id/pay — simulate UPI payout
router.patch('/:id/pay', payClaim);

// PATCH /api/claims/:id/flag — flag a claim for fraud review
router.patch('/:id/flag', flagClaim);

// F-10 — Quick Claim
router.post('/quick', quickClaim);

export default router;
