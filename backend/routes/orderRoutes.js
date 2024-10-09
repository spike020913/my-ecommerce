import express from 'express';
import { protectedRoute } from '../middleware/authMiddleware.js';
import { getOrder, deleteOrder } from '../controllers/orderController.js';
const router = express.Router();

router.get('/', protectedRoute, getOrder);
router.delete('/:orderId', protectedRoute, deleteOrder);

export default router;