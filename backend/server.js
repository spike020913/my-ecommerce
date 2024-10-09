import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import path from 'path';

import authRoutes from './routes/authRoutes.js';
import productsRoutes from './routes/productRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import couponRoutes from './routes/couponRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import { connectDB } from './lib/db.js';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// parse the request & cookies
app.use(express.json({limit: '10mb'}));
app.use(cookieParser());
const __dirname = path.resolve();

// use authRoutes middleware for any requests that start with the path /api/auth
app.use('/api/auth', authRoutes)
app.use('/api/products', productsRoutes)
app.use('/api/cart', cartRoutes)
app.use('/api/coupons', couponRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/orders', orderRoutes)

// Serve static assets if in production
if (process.env.NODE_ENV === "production") {
	app.use(express.static(path.join(__dirname, "/frontend/dist")));

	app.get("*", (req, res) => {
		res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
	});
}

app.listen(PORT, () => {
  console.log(`Server started at PORT ${PORT}`);
  connectDB();
});

// Z4jI36dpqar16U4r
