import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import { redis } from '../lib/redis.js';

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
        const user = await User.create({name, email, password});

        // Auth
        // Generate AT and RT based on userId
        const { accessToken, refreshToken } = generateTokens(user._id);
        await storeRefreshToken(user._id, refreshToken);

        setCookies(res, accessToken, refreshToken);

        res.status(201).json({ user:{
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
        }, message:"User Created Successfully" });
    } catch (error) {
        console.log("Error in signup", error);
        res.status(500).json({ message: error.message });
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
        res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        console.log("Error in logout", error);
        res.status(500).json({ message: error.message });
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