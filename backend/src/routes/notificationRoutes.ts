import { Router } from 'express';
import {
    getPublicKey,
    removeSubscription,
    saveSubscription
} from '../controllers/notificationController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

router.get('/public-key', getPublicKey);
router.post('/subscribe', authenticateToken, saveSubscription);
router.delete('/subscribe', authenticateToken, removeSubscription);

export default router;