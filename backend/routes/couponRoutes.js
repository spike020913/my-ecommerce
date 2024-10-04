import express from 'express';
import { protectedRoute, adminRoute } from '../middleware/authMiddleware.js';
import { getCoupon, validateCoupon, generateCoupon } from '../controllers/couponController.js';
const router = express.Router();

router.get('/', protectedRoute, getCoupon);
router.post('/validate', protectedRoute, validateCoupon);

router.post('/generate-coupon', protectedRoute, adminRoute, generateCoupon);

export default router;