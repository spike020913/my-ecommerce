import express from 'express';
import { getAllProducts, getFeaturedProducts, createProduct, deleteProduct, getRecommendations, getCategory, toggleFeaturedProduct } from '../controllers/productController.js';
import { protectedRoute, adminRoute } from '../middleware/authMiddleware.js';

const router = express.Router();

// when passed these two middlewares, run getALLProducts
router.get('/', protectedRoute, adminRoute, getAllProducts);
router.get('/featured', getFeaturedProducts);
router.get('/category/:category', getCategory);
router.get('/recommendations', getRecommendations);

router.patch('/:id', protectedRoute, adminRoute, toggleFeaturedProduct);
router.delete('/:id', protectedRoute, adminRoute, deleteProduct);

router.post('/', protectedRoute, adminRoute, createProduct);

export default router;