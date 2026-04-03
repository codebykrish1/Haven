import { Router } from 'express';
import {
  getMe,
  loginWorker,
  registerWorker,
} from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

// POST /api/auth/register
router.post('/register', registerWorker);

// POST /api/auth/login
router.post('/login', loginWorker);

// GET /api/auth/me  ← protected, needs JWT token
router.get('/me', protect, getMe);

export default router;
