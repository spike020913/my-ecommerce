import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please enter your name'],
    },
    email: {
        type: String,
        required: [true, 'Please enter your email'],
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: [true, 'Please enter your password'],
        minlength: [6, 'Your password must be at least 6 characters'],
    },
    lastLogin: {
        type: Date,
        default: Date.now,
    },
    isVerified: {
			type: Boolean,
			default: false,
		},
    cartItems: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
            },
            quantity: {
                type: Number,
                default: 1,
            },
        },
    ],
    role: {
        type: String,
        enum: ['customer', 'admin'],
        default: 'customer',
    },

    resetPasswordToken: String,
    resetPasswordExpireAt: Date,
    verificationToken: String,
    verificationTokenExpireAt: Date,
}, 
    // createdAt, updatedAt
{
    timestamps: true,
});

// Pre-save hook to hash the password before saving the user model, this hook is named as "save"
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        next();
    }

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next()
    } catch (error) {
        next(error);
    }
});

userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
}


const User = mongoose.model('User', userSchema);

export default User;