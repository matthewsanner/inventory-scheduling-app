import axios from "../utils/axiosConfig";

export const login = async (username, password) => {
  try {
    const response = await axios.post(`auth/login/`, {
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
        `auth/logout/`,
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

    const response = await axios.get(`auth/me/`, {
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

    const response = await axios.post(`auth/token/refresh/`, {
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

export const register = async (
  username,
  password,
  email,
  firstName,
  lastName
) => {
  try {
    const response = await axios.post(`auth/register/`, {
      username,
      password,
      email,
      first_name: firstName || "",
      last_name: lastName || "",
    });

    return { data: response.data };
  } catch (error) {
    if (error.response?.status === 400) {
      // Handle validation errors
      const errorData = error.response.data;
      let errorMessage = "Registration failed";

      if (typeof errorData === "object") {
        // Format Django REST framework validation errors
        const errors = [];
        for (const [field, messages] of Object.entries(errorData)) {
          if (Array.isArray(messages)) {
            errors.push(`${field}: ${messages.join(", ")}`);
          } else {
            errors.push(`${field}: ${messages}`);
          }
        }
        errorMessage = errors.join(". ");
      } else if (typeof errorData === "string") {
        errorMessage = errorData;
      }

      return { error: errorMessage };
    }
    return { error: error.response?.data?.detail || "Registration failed" };
  }
};
