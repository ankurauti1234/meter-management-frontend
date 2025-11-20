// services/api.ts
import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1",
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

// Refresh token interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/refresh")
    ) {
      originalRequest._retry = true;
      try {
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1"}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        return api(originalRequest);
      } catch (refreshError) {
        console.error("Refresh token failed:", refreshError);
        // Optional: redirect to login
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;