import { Router } from 'express';
import {
  getMySOSEvents,
  resolveSOSEvent,
  triggerSOS,
} from '../controllers/sos.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = Router();

router.use(protect);

// POST /api/sos — trigger SOS
router.post('/', triggerSOS);

// GET /api/sos/my — get my SOS history
router.get('/my', getMySOSEvents);

// PATCH /api/sos/:id/resolve
router.patch('/:id/resolve', resolveSOSEvent);

export default router;
