import axios from "axios";

const axiosInstance = axios.create({
    // if in development mode, use the development server, otherwise use the production xxx/api
	baseURL: import.meta.mode === "development" ? "http://localhost:5000/api" : "/api",
	withCredentials: true, // send cookies to the server
});

export default axiosInstance;