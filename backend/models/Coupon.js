import mongoose from "mongoose";

const couponSchema = mongoose.Schema({
    code: {
        type: String,
        required: [true, 'Please enter the coupon code'],
        unique: true,
    },
    discountPercentage: {
        type: Number,
        required: [true, 'Please enter the discount amount'],
        min: 0,
        max: 100,
    },
    expirationDate: {
        type: Date,
        required: [true, 'Please enter the expiry date'],
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true,
    },
}, 
    // createdAt, updatedAt
{
    timestamps: true,
});

const Coupon = mongoose.model('Coupon', couponSchema);

export default Coupon;