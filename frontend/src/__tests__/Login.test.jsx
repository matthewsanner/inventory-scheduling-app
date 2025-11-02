import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import Login from "../pages/Login";
import { AuthProvider } from "../contexts/AuthContext";
import * as AuthService from "../services/AuthService";

vi.mock("../services/AuthService");

// Mock useNavigate from react-router
vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useNavigate: vi.fn(() => vi.fn()),
  };
});

const renderLogin = () => {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <Login />
      </AuthProvider>
    </MemoryRouter>
  );
};

describe("Login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    // Mock getCurrentUser to resolve immediately for tests that don't set a token
    vi.mocked(AuthService.getCurrentUser).mockResolvedValue({
      error: "Not authenticated",
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("renders the login form", async () => {
    renderLogin();
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /Sign In/i })
      ).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Username/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/Password/i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Sign In/i })
      ).toBeInTheDocument();
    });
  });

  it("allows user to type in username and password fields", async () => {
    const user = userEvent.setup();
    renderLogin();

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Username/i)).toBeInTheDocument();
    });

    const usernameInput = screen.getByPlaceholderText(/Username/i);
    const passwordInput = screen.getByPlaceholderText(/Password/i);

    await user.type(usernameInput, "testuser");
    await user.type(passwordInput, "testpass123");

    expect(usernameInput).toHaveValue("testuser");
    expect(passwordInput).toHaveValue("testpass123");
  });

  it("shows error message on failed login", async () => {
    const user = userEvent.setup();
    vi.mocked(AuthService.login).mockResolvedValue({
      data: null,
      error: "Invalid username or password",
    });

    renderLogin();

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Username/i)).toBeInTheDocument();
    });

    const usernameInput = screen.getByPlaceholderText(/Username/i);
    const passwordInput = screen.getByPlaceholderText(/Password/i);
    const submitButton = screen.getByRole("button", { name: /Sign In/i });

    await user.type(usernameInput, "wronguser");
    await user.type(passwordInput, "wrongpass");

    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/Invalid username or password/i)
      ).toBeInTheDocument();
    });
  });

  it("calls login service with correct credentials", async () => {
    const user = userEvent.setup();
    const mockUser = {
      id: 1,
      username: "testuser",
      email: "test@example.com",
      is_manager: true,
      is_staff: false,
      groups: ["Manager"],
    };

    vi.mocked(AuthService.login).mockResolvedValue({
      data: {
        access: "mock-access-token",
        refresh: "mock-refresh-token",
        user: mockUser,
      },
    });

    renderLogin();

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Username/i)).toBeInTheDocument();
    });

    const usernameInput = screen.getByPlaceholderText(/Username/i);
    const passwordInput = screen.getByPlaceholderText(/Password/i);
    const submitButton = screen.getByRole("button", { name: /Sign In/i });

    await user.type(usernameInput, "testuser");
    await user.type(passwordInput, "testpass123");

    await user.click(submitButton);

    await waitFor(() => {
      expect(AuthService.login).toHaveBeenCalledWith("testuser", "testpass123");
    });
  });

  it("disables form fields and button while loading", async () => {
    const user = userEvent.setup();
    let resolveLogin;
    const loginPromise = new Promise((resolve) => {
      resolveLogin = resolve;
    });

    vi.mocked(AuthService.login).mockReturnValue(loginPromise);

    renderLogin();

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Username/i)).toBeInTheDocument();
    });

    const usernameInput = screen.getByPlaceholderText(/Username/i);
    const passwordInput = screen.getByPlaceholderText(/Password/i);
    const submitButton = screen.getByRole("button", { name: /Sign In/i });

    await user.type(usernameInput, "testuser");
    await user.type(passwordInput, "testpass123");

    // Click button to trigger async state updates
    await user.click(submitButton);

    await waitFor(() => {
      expect(submitButton).toBeDisabled();
      expect(usernameInput).toBeDisabled();
      expect(passwordInput).toBeDisabled();
      expect(screen.getByText(/Signing in.../i)).toBeInTheDocument();
    });

    // Resolve the promise
    const loginData = {
      data: {
        access: "token",
        refresh: "refresh",
        user: { id: 1, username: "testuser" },
      },
    };

    resolveLogin(loginData);

    // Wait for the promise to resolve and state to update
    await waitFor(
      () => {
        expect(submitButton).not.toBeDisabled();
      },
      { timeout: 100 }
    );
  });

  it("requires username and password fields", async () => {
    const user = userEvent.setup();
    renderLogin();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Sign In/i })
      ).toBeInTheDocument();
    });

    const submitButton = screen.getByRole("button", { name: /Sign In/i });

    await user.click(submitButton);

    const usernameInput = screen.getByPlaceholderText(/Username/i);
    const passwordInput = screen.getByPlaceholderText(/Password/i);

    expect(usernameInput).toBeInvalid();
    expect(passwordInput).toBeInvalid();
  });
});
