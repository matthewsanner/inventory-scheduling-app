import { createContext, useContext, useState, useEffect } from "react";
import { login as loginService, logout as logoutService, getCurrentUser } from "../services/AuthService";

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      const accessToken = localStorage.getItem("access_token");
      if (accessToken) {
        const result = await getCurrentUser();
        if (result.data) {
          setUser(result.data);
        } else {
          // Token might be invalid, clear it
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (username, password) => {
    const result = await loginService(username, password);
    if (result.data) {
      setUser(result.data.user);
      return { success: true };
    } else {
      return { success: false, error: result.error };
    }
  };

  const logout = async () => {
    await logoutService();
    setUser(null);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

