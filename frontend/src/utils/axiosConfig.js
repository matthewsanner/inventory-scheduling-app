import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

// Configure axios defaults
axios.defaults.baseURL = API_URL;

// Add a request interceptor to include JWT token in all requests
axios.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem("access_token");
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle token refresh on 401 errors
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshTokenValue = localStorage.getItem("refresh_token");
        
        if (refreshTokenValue) {
          const response = await axios.post(`${API_URL}auth/token/refresh/`, {
            refresh: refreshTokenValue,
          });

          const newAccessToken = response.data.access;
          localStorage.setItem("access_token", newAccessToken);

          // Retry the original request with the new token
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return axios(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        // Don't redirect here - let the auth context handle it
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axios;

