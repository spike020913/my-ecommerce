import Coupon from "../models/Coupon.js";

export const getCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.findOne( { userId: req.user._id, isActive: true });
        res.json(coupon || null);
    } catch (error) {
        console.log("Error in getCoupon", error);
        res.status(500).json({ message: error.message });
    }
}

export const validateCoupon = async (req, res) => {
    try {
        const { code } = req.body;
        // Find the coupon with the given code, owned by the logged in user, and is active
        const coupon = await Coupon.findOne({ code: code, userId: req.user._id, isActive: true });
        if (!coupon) {
            res.status(404);
            throw new Error('Coupon not found');
        }
        if (coupon.expirationDate < new Date()) {
            res.status(400);
            throw new Error('Coupon has expired');
        }
        res.json({
            message: "Coupon is valid",
            code: coupon.code,
            discountPercentage: coupon.discountPercentage,
        });
    } catch (error) {
        console.log("Error in validateCoupon", error);
        res.status(500).json({ message: error.message });
    }
}

export const generateCoupon = async (req, res) => {
    try {
        const { code, discountPercentage, expirationDate } = req.body;
        const coupon = await Coupon.create({
            code,
            discountPercentage,
            expirationDate,
            userId: req.user._id,
        });
        res.status(201).json(coupon);
    } catch (error) {
        console.log("Error in generateCoupon", error);
        res.status(500).json({ message: error.message });
    }
}