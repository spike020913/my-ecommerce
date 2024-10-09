import User from '../models/User.js';
import Product from '../models/Product.js';

export const addToCart = async (req, res) => {
    try {
        const { productId } = req.body;
        const user = req.user;
        const existingItem = user.cartItems.find(item => item.id === productId);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            user.cartItems.push(productId);
        }

        await user.save();
        res.json(user.cartItems);
    } catch (error) {
        console.log("Error in addToCart", error);
        res.status(500).json({ message: error.message });
    }
}

// export const getCartProducts = async (req, res) => {
//     try {
//         const user = await User.findById(req.user._id);
//         if (!user) {
//             res.status(404);
//             throw new Error('User not found');
//         }
//         res.json(user.cart);
//     }
//     catch (error) {
//         console.log("Error in getCartProducts", error);
//         res.status(500).json({ message: error.message });
//     }
// }

export const getCartProducts = async (req, res) => {
    try {
        const products = await Product.find({ _id: { $in: req.user.cartItems } });
        // Add quantity to each product
        const cartItems = products.map(product => {
            const cartItem = req.user.cartItems.find(item => item.id === product.id);
            return { ...product.toJSON(), quantity: cartItem.quantity};
        });
        res.json(cartItems);
    }
    catch (error) {
        console.log("Error in getCartProducts", error);
        res.status(500).json({ message: error.message });
    }
}

export const removeAllFromCart = async (req, res) => {
    try {
        const { productId } = req.body;
        const user = req.user;
        if (!productId) {
            // Boring check xD
            user.cartItems = [];
        } else {
            user.cartItems = user.cartItems.filter(item => item.id !== productId);
        }
        await user.save();
        res.json(user.cartItems);
    } catch (error) {
        console.log("Error in removeAllFromCart", error);
        res.status(500).json({ message: error.message });
    }
}

export const updateQuantity = async (req, res) => {
	try {
		const { id: productId } = req.params;
		const { quantity } = req.body;
		const user = req.user;
		const existingItem = user.cartItems.find((item) => item.id === productId);

		if (existingItem) {
			if (quantity === 0) {
				user.cartItems = user.cartItems.filter((item) => item.id !== productId);
				await user.save();
				return res.json(user.cartItems);
			}

			existingItem.quantity = quantity;
			await user.save();
			res.json(user.cartItems);
		} else {
			res.status(404).json({ message: "Product not found" });
		}
	} catch (error) {
		console.log("Error in updateQuantity controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};