import User from '../models/User.js';
import Order from '../models/Order.js';

export const getOrder = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id }).populate('products.product');
        res.status(200).json(orders);
    } catch (error) {
        console.error('Error getting orders:', error);
        res.status(500).json({ message: 'Error getting orders', error: error.message });
    }
}

export const deleteOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        await Order.findByIdAndDelete(orderId);
        res.status(200).json({ message: 'Order deleted successfully' });
    } catch (error) {
        console.error('Error deleting order:', error);
        res.status(500).json({ message: 'Error deleting order', error: error.message });
    }
}