import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protectedRoute = async (req, res, next) => {
    try {
        const token = req.cookies.accessToken;
        if (!token) {
            return res.status(401).json({ message: "Unauthorized - No access token provided" });
        }

        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decoded.userId).select('-password');

        if (!user) {
            res.status(404);
            throw new Error('User not found');
        }
        req.user = user;

        next();
    } catch (error) {
        console.log("Error in protectedRoute", error);
        if (error.name === 'TokenExpiredError') {
            res.status(401).json({ message: 'Not Authorized, Token Expired' });
        } else {
            res.status(401).json({ message: error.message });
        }
    }
};

export const adminRoute = async (req, res, next) => {
    try {
        if (req.user && req.user.role !== 'admin') {
            res.status(403);
            throw new Error('Not Authorized, Not an Admin');
        }
        next();
    } catch (error) {
        console.log("Error in adminRoute", error);
        res.status(403).json({ message: error.message });
    }
};