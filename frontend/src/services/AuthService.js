import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export const login = async (username, password) => {
  try {
    const response = await axios.post(`${API_URL}auth/login/`, {
      username,
      password,
    });
    
    // Store tokens in localStorage
    localStorage.setItem("access_token", response.data.access);
    localStorage.setItem("refresh_token", response.data.refresh);
    
    return { data: response.data };
  } catch (error) {
    if (error.response?.status === 401) {
      return { error: "Invalid username or password" };
    }
    return { error: error.response?.data?.detail || "Login failed" };
  }
};

export const logout = async () => {
  try {
    const accessToken = localStorage.getItem("access_token");
    
    if (accessToken) {
      // Call logout endpoint if we have a token
      await axios.post(
        `${API_URL}auth/logout/`,
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
    }
  } catch (error) {
    // Even if logout fails, clear local storage
    console.error("Logout error:", error);
  } finally {
    // Always clear tokens from localStorage
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  }
};

export const getCurrentUser = async () => {
  try {
    const accessToken = localStorage.getItem("access_token");
    
    if (!accessToken) {
      return { error: "Not authenticated" };
    }
    
    const response = await axios.get(`${API_URL}auth/me/`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    
    return { data: response.data };
  } catch (error) {
    // If token is invalid, clear it
    if (error.response?.status === 401) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
    }
    return { error: error.response?.data?.detail || "Failed to get user" };
  }
};

export const refreshToken = async () => {
  try {
    const refreshTokenValue = localStorage.getItem("refresh_token");
    
    if (!refreshTokenValue) {
      return { error: "No refresh token" };
    }
    
    const response = await axios.post(`${API_URL}auth/token/refresh/`, {
      refresh: refreshTokenValue,
    });
    
    localStorage.setItem("access_token", response.data.access);
    
    return { data: response.data };
  } catch (error) {
    // If refresh fails, clear tokens
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    return { error: "Token refresh failed" };
  }
};

