import { create } from "zustand";
import axiosInstance from "../lib/axios";
import { toast } from "react-hot-toast";

export const useOrderStore = create((set, get) => ({
    order: [],

    getOrders: async () => {
        try {
            const response = await axiosInstance.get("/orders");
            set({ order: response.data });
        } catch (error) {
            console.error("Error fetching orders:", error);
        }
    },

    deleteOrder: async (orderId) => {
        try {
            await axiosInstance.delete(`/orders/${orderId}`);
            get().getOrders();
            toast.success("Order deleted successfully");
        } catch (error) {
            console.error("Error deleting order:", error);
            toast.error(error.response?.data?.message || "Failed to delete order");
        }
    },
}));