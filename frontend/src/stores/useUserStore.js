import { create } from "zustand";
import axiosInstance from "../lib/axios";
import { toast } from "react-hot-toast";

export const useUserStore = create((set, get) => ({
    user: null,
	isAuthenticated: false,
	error: null,
    loading: false,
    checkingAuth: true,
	message: null,
	
    signup: async ({ name, email, password, confirmPassword }) => {
		set({ loading: true });

		if (password !== confirmPassword) {
			set({ loading: false });
			return toast.error("Passwords do not match");
		}

		try {
			const res = await axiosInstance.post("/auth/signup", { name, email, password });
			set({ user: res.data.user, loading: false, isAuthenticated: true });
			return res.data;
		} catch (error) {
			set({ loading: false });
			toast.error(error.response.data.message || "An error occurred");
		}
	},

	login: async (email, password) => {
		set({ loading: true });

		try {
			const res = await axiosInstance.post("/auth/login", { email, password });
			set({ user: res.data, loading: false, isAuthenticated: true});
		} catch (error) {
			set({ loading: false });
			toast.error(error.response.data.message || "An error occurred");
		}
	},

	logout: async () => {
		try {
			await axiosInstance.post("/auth/logout");
			set({ user: null, isAuthenticated: false });
		} catch (error) {
			toast.error(error.response?.data?.message || "An error occurred during logout");
		}
	},

	verifyEmail: async (code) => {
		set({ loading: true, error: null });
		try {
			const response = await axiosInstance.post(`/auth/verify-email`, { code });
			set({ user: response.data.user, isAuthenticated: true, loading: false });
			
			// TODO
			return response.data;
		} catch (error) {
			set({ error: error.response.data.message || "Error verifying email", loading: false });
			throw error;
		}
	},

	forgotPassword: async (email) => {
		set({ loading: true, error: null });
		try {
			const response = await axiosInstance.post(`/auth/forgot-password`, { email });
			set({ message: response.data.message, loading: false });
		} catch (error) {
			set({
				loading: false,
				error: error.response.data.message || "Error sending reset password email",
			});
			throw error;
		}
	},

	resetPassword: async (token, password) => {
		set({ isLoading: true, error: null });
		try {
			const response = await axiosInstance.post(`/auth/reset-password/${token}`, { password });
			set({ message: response.data.message, loading: false });
		} catch (error) {
			set({
				loading: false,
				error: error.response.data.message || "Error resetting password",
			});
			throw error;
		}
	},

	checkAuth: async () => {
		set({ checkingAuth: true, error: null });
		try {
			const response = await axiosInstance.get("/auth/profile");
			set({ user: response.data, checkingAuth: false, isAuthenticated: true });
		} catch (error) {
			console.log(error.message);
			set({ checkingAuth: false, user: null });
		}
	},

	refreshToken: async () => {
		// Prevent multiple simultaneous refresh attempts
		if (get().checkingAuth) return;

		set({ checkingAuth: true });
		try {
			const response = await axiosInstance.post("/auth/refresh-token");
			set({ checkingAuth: false });
			return response.data;
		} catch (error) {
			set({ user: null, checkingAuth: false });
			throw error;
		}
	},
}));

// Axios interceptor to handle 401 errors
// 15 min过了，会有401错误，这个interceptor会自动refresh token
let refreshPromise = null;

axiosInstance.interceptors.response.use(
	(response) => response,
	async (error) => {
		const originalRequest = error.config;
		if (error.response?.status === 401 && !originalRequest._retry) {
			originalRequest._retry = true;

			try {
				// If a refresh is already in progress, wait for it to complete
				if (refreshPromise) {
					await refreshPromise;
					return axiosInstance(originalRequest);
				}

				// Start a new refresh process
				refreshPromise = useUserStore.getState().refreshToken();
				await refreshPromise;
				refreshPromise = null;

				return axiosInstance(originalRequest);
			} catch (refreshError) {
				// If refresh fails, redirect to login or handle as needed
				useUserStore.getState().logout();
				return Promise.reject(refreshError);
			}
		}
		return Promise.reject(error);
	}
);