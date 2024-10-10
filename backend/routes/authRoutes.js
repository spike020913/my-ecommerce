import express from 'express';
import { signup, login, logout, refreshToken, getProfile, verifyEmail, forgotPassword, resetPassword } from '../controllers/authController.js';
import { protectedRoute } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/signup', signup);

router.post('/login',login);

router.post('/logout', logout);

router.post('/refresh-token', refreshToken);

router.post("/verify-email", verifyEmail);

router.post("/forgot-password", forgotPassword);

router.post("/reset-password/:token", resetPassword);

router.get('/profile', protectedRoute, getProfile);

export default router;