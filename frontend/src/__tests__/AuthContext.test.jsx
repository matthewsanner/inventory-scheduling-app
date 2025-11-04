import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, renderHook, waitFor, act } from "@testing-library/react";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import * as AuthService from "../services/AuthService";

vi.mock("../services/AuthService");

describe("AuthContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("throws error when useAuth is used outside AuthProvider", () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => {
      renderHook(() => useAuth());
    }).toThrow("useAuth must be used within an AuthProvider");

    consoleSpy.mockRestore();
  });

  it("provides initial unauthenticated state", async () => {
    vi.mocked(AuthService.getCurrentUser).mockResolvedValue({
      error: "Not authenticated",
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBe(null);
    });
  });

  it("loads user from token on mount", async () => {
    const mockUser = {
      id: 1,
      username: "testuser",
      email: "test@example.com",
      is_manager: true,
      is_staff: false,
      groups: ["Manager"],
    };

    vi.mocked(AuthService.getCurrentUser).mockResolvedValue({
      data: mockUser,
    });

    localStorage.setItem("access_token", "mock-token");

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUser);
    });

    expect(AuthService.getCurrentUser).toHaveBeenCalled();
  });

  it("clears tokens and user when getCurrentUser fails", async () => {
    vi.mocked(AuthService.getCurrentUser).mockResolvedValue({
      error: "Invalid token",
    });

    localStorage.setItem("access_token", "invalid-token");
    localStorage.setItem("refresh_token", "invalid-refresh");

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBe(null);
      expect(localStorage.getItem("access_token")).toBe(null);
      expect(localStorage.getItem("refresh_token")).toBe(null);
    });
  });

  it("successfully logs in and sets user", async () => {
    const mockUser = {
      id: 1,
      username: "testuser",
      email: "test@example.com",
      is_manager: false,
      is_staff: true,
      groups: ["Staff"],
    };

    // Mock login to actually set localStorage (matching real behavior)
    vi.mocked(AuthService.login).mockImplementation(async () => {
      localStorage.setItem("access_token", "access-token");
      localStorage.setItem("refresh_token", "refresh-token");
      return {
        data: {
          access: "access-token",
          refresh: "refresh-token",
          user: mockUser,
        },
      };
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(false);
    });

    let loginResult;
    await act(async () => {
      loginResult = await result.current.login("testuser", "password123");
    });

    await waitFor(() => {
      expect(loginResult.success).toBe(true);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUser);
    });

    // Check localStorage after login
    expect(localStorage.getItem("access_token")).toBe("access-token");
    expect(localStorage.getItem("refresh_token")).toBe("refresh-token");
  });

  it("handles login failure", async () => {
    vi.mocked(AuthService.login).mockResolvedValue({
      data: null,
      error: "Invalid credentials",
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(false);
    });

    let loginResult;
    await act(async () => {
      loginResult = await result.current.login("wronguser", "wrongpass");
    });

    expect(loginResult.success).toBe(false);
    expect(loginResult.error).toBe("Invalid credentials");
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBe(null);
  });

  it("successfully logs out", async () => {
    const mockUser = {
      id: 1,
      username: "testuser",
      email: "test@example.com",
      is_manager: true,
      is_staff: false,
      groups: ["Manager"],
    };

    vi.mocked(AuthService.getCurrentUser).mockResolvedValue({
      data: mockUser,
    });
    vi.mocked(AuthService.logout).mockResolvedValue();

    localStorage.setItem("access_token", "mock-token");

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });

    await act(async () => {
      await result.current.logout();
    });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBe(null);
      expect(AuthService.logout).toHaveBeenCalled();
    });
  });

  it("provides loading state", async () => {
    // Set a token so getCurrentUser is called (otherwise loading becomes false immediately)
    localStorage.setItem("access_token", "mock-token");
    
    vi.mocked(AuthService.getCurrentUser).mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({ error: "Invalid token" });
          }, 100);
        })
    );

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
    });

    // Loading should be true initially while checking auth
    expect(result.current.loading).toBe(true);

    // Wait for loading to become false after auth check completes
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    }, { timeout: 200 });
  });
});

