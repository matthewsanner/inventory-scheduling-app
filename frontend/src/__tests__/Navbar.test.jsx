import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import Navbar from "../components/Navbar";
import { AuthProvider } from "../contexts/AuthContext";
import * as AuthService from "../services/AuthService";

vi.mock("../services/AuthService");

const renderNavbar = () => {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <Navbar />
      </AuthProvider>
    </MemoryRouter>
  );
};

describe("Navbar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    // Mock getCurrentUser to resolve immediately for tests that don't set a token
    vi.mocked(AuthService.getCurrentUser).mockResolvedValue({
      error: "Not authenticated",
    });
  });

  it("renders the brand name", async () => {
    renderNavbar();
    await waitFor(() => {
      expect(screen.getByText(/InventoryFlow/i)).toBeInTheDocument();
    });
  });

  it("renders the correct links", async () => {
    renderNavbar();
    await waitFor(() => {
      expect(screen.getByText(/Home/i).getAttribute("href")).toBe("/");
      expect(screen.getByText(/Items/i).getAttribute("href")).toBe("/items");
    });
  });

  it("shows Sign In and Sign Up buttons when not authenticated", async () => {
    renderNavbar();
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Sign In/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Sign Up/i })
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /Sign Out/i })
      ).not.toBeInTheDocument();
    });
  });

  it("has correct links for Sign Up and Sign In buttons when not authenticated", async () => {
    renderNavbar();
    await waitFor(() => {
      const signUpLink = screen
        .getByRole("button", { name: /Sign Up/i })
        .closest("a");
      const signInLink = screen
        .getByRole("button", { name: /Sign In/i })
        .closest("a");
      expect(signUpLink?.getAttribute("href")).toBe("/register");
      expect(signInLink?.getAttribute("href")).toBe("/login");
    });
  });

  it("shows user name and Sign Out button when authenticated", async () => {
    const mockUser = {
      id: 1,
      username: "testuser",
      first_name: "Test",
      last_name: "User",
      email: "test@example.com",
      is_manager: true,
      is_staff: false,
      groups: ["Manager"],
    };

    vi.mocked(AuthService.getCurrentUser).mockResolvedValue({
      data: mockUser,
    });

    localStorage.setItem("access_token", "mock-token");

    renderNavbar();

    await waitFor(() => {
      expect(screen.getByText(/Test User/i)).toBeInTheDocument();
    });

    expect(
      screen.getByRole("button", { name: /Sign Out/i })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Sign In/i })
    ).not.toBeInTheDocument();
  });

  it("shows username when user has no first/last name", async () => {
    const mockUser = {
      id: 1,
      username: "testuser",
      email: "test@example.com",
      is_manager: false,
      is_staff: true,
      groups: ["Staff"],
    };

    vi.mocked(AuthService.getCurrentUser).mockResolvedValue({
      data: mockUser,
    });

    localStorage.setItem("access_token", "mock-token");

    renderNavbar();

    await waitFor(() => {
      expect(screen.getByText(/testuser/i)).toBeInTheDocument();
    });
  });

  it("calls logout service when Sign Out is clicked", async () => {
    const user = userEvent.setup();
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

    renderNavbar();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Sign Out/i })
      ).toBeInTheDocument();
    });

    const signOutButton = screen.getByRole("button", { name: /Sign Out/i });
    await user.click(signOutButton);

    expect(AuthService.logout).toHaveBeenCalled();
  });

  it("renders user icon when authenticated", async () => {
    const mockUser = {
      id: 1,
      username: "testuser",
      first_name: "Test",
      last_name: "User",
      email: "test@example.com",
      is_manager: true,
      is_staff: false,
      groups: ["Manager"],
    };

    vi.mocked(AuthService.getCurrentUser).mockResolvedValue({
      data: mockUser,
    });

    localStorage.setItem("access_token", "mock-token");

    renderNavbar();

    await waitFor(() => {
      // Check for the user icon
      const userIcon = screen
        .getByText(/Test User/i)
        .closest("div")
        ?.querySelector("svg");
      expect(userIcon).toBeInTheDocument();
    });
  });
});
