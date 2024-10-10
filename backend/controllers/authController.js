import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { redis } from '../lib/redis.js';
import {
	sendPasswordResetEmail,
	sendResetSuccessEmail,
	sendVerificationEmail,
	sendWelcomeEmail,
} from "../mailtrap/emails.js";

const generateTokens = (userId) => {
    const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '7d' });
    return { accessToken, refreshToken };
};

const storeRefreshToken = async (userId, refreshToken) => {
    await redis.set(`refresh_token:${userId}`, refreshToken, 'EX', 7*24*60*60); // 7days
}

const setCookies = (res, accessToken, refreshToken) => {
    res.cookie("accessToken", accessToken, {
		httpOnly: true, // prevent XSS attacks, cross site scripting attack
		secure: process.env.NODE_ENV === "production",
		sameSite: "strict", // prevents CSRF attack, cross-site request forgery attack
		maxAge: 15 * 60 * 1000, // 15 minutes
	});
	res.cookie("refreshToken", refreshToken, {
		httpOnly: true, // prevent XSS attacks, cross site scripting attack
		secure: process.env.NODE_ENV === "production",
		sameSite: "strict", // prevents CSRF attack, cross-site request forgery attack
		maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
	});
}

export const signup = async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const userExists = await User.findOne( { email } );

        if (userExists) {
            return res.status(400).json({ message: "User already exists" });
        }

        const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
        const verificationTokenExpireAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
        
        const user = await User.create({name, email, password, verificationToken, verificationTokenExpireAt});

        // Auth
        // Generate AT and RT based on userId
        const { accessToken, refreshToken } = generateTokens(user._id);
        await storeRefreshToken(user._id, refreshToken);
        setCookies(res, accessToken, refreshToken);

        await sendVerificationEmail(email, verificationToken);

        // res.status(201).json({ user:{
        //     _id: user._id,
        //     name: user.name,
        //     email: user.email,
        //     role: user.role,
        // }, message:"User Created Successfully" });
        res.status(201).json({
			success: true,
			message: "User created successfully",
			user: {
				...user._doc,
				password: undefined,
			},
		});
    } catch (error) {
        console.log("Error in signup", error);
        res.status(500).json({ message: error.message });
    }
};

export const verifyEmail = async (req, res) => {
	const { code } = req.body;
	try {
		const user = await User.findOne({
			verificationToken: code,
			verificationTokenExpireAt: { $gt: Date.now() },
		});

        console.log(Date.now());

		if (!user) {
			return res.status(400).json({ success: false, message: "Invalid or expired verification code" });
		}

		user.isVerified = true;
		user.verificationToken = undefined;
		user.verificationTokenExpireAt = undefined;
		await user.save();

		await sendWelcomeEmail(user.email, user.name);

		res.status(200).json({
			success: true,
			message: "Email verified successfully",
			user: {
				...user._doc,
				password: undefined,
			},
		});
	} catch (error) {
		console.log("error in verifyEmail ", error);
		res.status(500).json({ success: false, message: "Server error" });
	}
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user || !(await user.matchPassword(password))) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        const { accessToken, refreshToken } = generateTokens(user._id);
        await storeRefreshToken(user._id, refreshToken);
        setCookies(res, accessToken, refreshToken);

        user.lastLogin = Date.now();
        await user.save();

        res.json( {
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
         });

    } catch (error) {
        console.log("Error in login", error);
        res.status(500).json({ message: error.message });
    }
};

export const logout = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        console.log(req.cookies);
        if (refreshToken) {
            // Decode RT based on userId
            const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
            console.log(decoded);
            await redis.del(`refresh_token:${decoded.userId}`);
        }
        console.log("Logging out!");
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');
        res.clearCookie('jwt');
        res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        console.log("Error in logout", error);
        res.status(500).json({ message: error.message });
    }
};

export const forgotPassword = async (req, res) => {
	const { email } = req.body;
	try {
		const user = await User.findOne({ email });

		if (!user) {
			return res.status(400).json({ success: false, message: "User not found" });
		}

		// Generate reset token
		const resetToken = crypto.randomBytes(20).toString("hex");
		const resetTokenExpiresAt = Date.now() + 1 * 60 * 60 * 1000; // 1 hour

		user.resetPasswordToken = resetToken;
		user.resetPasswordExpireAt = resetTokenExpiresAt;

		await user.save();

		// send email
		await sendPasswordResetEmail(user.email, `${process.env.CLIENT_URL}/reset-password/${resetToken}`);

		res.status(200).json({ success: true, message: "Password reset link sent to your email" });
	} catch (error) {
		console.log("Error in forgotPassword ", error);
		res.status(400).json({ success: false, message: error.message });
	}
};

export const resetPassword = async (req, res) => {
	try {
		const { token } = req.params;
		const { password } = req.body;

		const user = await User.findOne({
			resetPasswordToken: token,
			resetPasswordExpireAt: { $gt: Date.now() },
		});

		if (!user) {
			return res.status(400).json({ success: false, message: "Invalid or expired reset token" });
		}

		user.password = password;
		user.resetPasswordToken = undefined;
		user.resetPasswordExpireAt = undefined;
		await user.save();

		await sendResetSuccessEmail(user.email);

		res.status(200).json({ success: true, message: "Password reset successful" });
	} catch (error) {
		console.log("Error in resetPassword ", error);
		res.status(400).json({ success: false, message: error.message });
	}
};

export const refreshToken = async (req, res) => {
    try {
        const refreshToken = req.cookies.refreshToken;
        if (!refreshToken) {
            res.status(401);
            throw new Error('No refresh token');
        }
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        // Check if the RT is valid
        const storedRefreshToken = await redis.get(`refresh_token:${decoded.userId}`);
        if (refreshToken !== storedRefreshToken) {
            res.status(401);
            throw new Error('Invalid refresh token');
        }

        const accessToken = jwt.sign({ userId: decoded.userId }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });

        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            sameSite: 'strict',
            secure: process.env.NODE_ENV === 'production' ? true : false,
            maxAge: 15*60*1000,
        });
        res.json({ message: 'Refreshed token successfully' });
    } catch (error) {
        console.log("Error in refreshToken", error);
        res.status(500).json({ message: error.message });
    }
};

export const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        res.json(user);
    } catch (error) {
        console.log("Error in getProfile", error);
        res.status(500).json({ message: error.message });
    }
};