import express from 'express';
import { protectedRoute } from '../middleware/authMiddleware.js';
import { createCheckoutSession, checkoutSuccess } from '../controllers/paymentController.js';
import Stripe from 'stripe';

const router = express.Router();

router.post('/create-checkout-session', protectedRoute, createCheckoutSession); 
router.post("/checkout-success", protectedRoute, checkoutSuccess);

export default router;