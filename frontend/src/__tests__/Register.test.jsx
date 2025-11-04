import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import Register from "../pages/Register";
import { AuthProvider } from "../contexts/AuthContext";
import * as AuthService from "../services/AuthService";

vi.mock("../services/AuthService");

// Mock useNavigate from react-router
const mockNavigate = vi.fn();
vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useNavigate: vi.fn(() => mockNavigate),
  };
});

const renderRegister = () => {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <Register />
      </AuthProvider>
    </MemoryRouter>
  );
};

describe("Register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockNavigate.mockClear();
    // Mock getCurrentUser to resolve immediately for tests that don't set a token
    vi.mocked(AuthService.getCurrentUser).mockResolvedValue({
      error: "Not authenticated",
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("renders the registration form", async () => {
    renderRegister();
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /Create Account/i })
      ).toBeInTheDocument();
      expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^Password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Confirm Password/i)).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Create Account/i })
      ).toBeInTheDocument();
    });
  });

  it("allows user to type in all form fields", async () => {
    const user = userEvent.setup();
    renderRegister();

    await waitFor(() => {
      expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
    });

    const usernameInput = screen.getByLabelText(/Username/i);
    const emailInput = screen.getByLabelText(/Email Address/i);
    const passwordInput = screen.getByLabelText(/^Password$/i);
    const confirmPasswordInput = screen.getByLabelText(/Confirm Password/i);
    const firstNameInput = screen.getByLabelText(/First Name/i);
    const lastNameInput = screen.getByLabelText(/Last Name/i);

    await user.type(usernameInput, "testuser");
    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "testpass123");
    await user.type(confirmPasswordInput, "testpass123");
    await user.type(firstNameInput, "Test");
    await user.type(lastNameInput, "User");

    expect(usernameInput).toHaveValue("testuser");
    expect(emailInput).toHaveValue("test@example.com");
    expect(passwordInput).toHaveValue("testpass123");
    expect(confirmPasswordInput).toHaveValue("testpass123");
    expect(firstNameInput).toHaveValue("Test");
    expect(lastNameInput).toHaveValue("User");
  });

  it("shows error message when required fields are missing", async () => {
    const user = userEvent.setup();
    renderRegister();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Create Account/i })
      ).toBeInTheDocument();
    });

    const submitButton = screen.getByRole("button", {
      name: /Create Account/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/Please fill out all required fields/i)
      ).toBeInTheDocument();
    });
  });

  it("shows error message for invalid email format", async () => {
    const user = userEvent.setup();
    renderRegister();

    const usernameInput = screen.getByLabelText(/Username/i);
    const emailInput = screen.getByLabelText(/Email address/i);
    const passwordInput = screen.getByLabelText(/^Password$/i);
    const confirmPasswordInput = screen.getByLabelText(/Confirm password/i);
    const submitButton = screen.getByRole("button", {
      name: /Create Account/i,
    });

    await user.type(usernameInput, "testuser");
    await user.type(emailInput, "invalid-email");
    await user.type(passwordInput, "testpass123");
    await user.type(confirmPasswordInput, "testpass123");
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/Please enter a valid email address/i)
      ).toBeInTheDocument();
    });
  });

  it("shows error message when passwords do not match", async () => {
    const user = userEvent.setup();
    renderRegister();

    await waitFor(() => {
      expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
    });

    const usernameInput = screen.getByLabelText(/Username/i);
    const emailInput = screen.getByLabelText(/Email Address/i);
    const passwordInput = screen.getByLabelText(/^Password$/i);
    const confirmPasswordInput = screen.getByLabelText(/Confirm Password/i);
    const submitButton = screen.getByRole("button", {
      name: /Create Account/i,
    });

    await user.type(usernameInput, "testuser");
    await user.type(emailInput, "test@user.com");
    await user.type(passwordInput, "testpass123");
    await user.type(confirmPasswordInput, "differentpass");
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Passwords do not match/i)).toBeInTheDocument();
    });
  });

  it("shows error message when password is too short", async () => {
    const user = userEvent.setup();
    renderRegister();

    await waitFor(() => {
      expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
    });

    const usernameInput = screen.getByLabelText(/Username/i);
    const emailInput = screen.getByLabelText(/Email Address/i);
    const passwordInput = screen.getByLabelText(/^Password$/i);
    const confirmPasswordInput = screen.getByLabelText(/Confirm Password/i);
    const submitButton = screen.getByRole("button", {
      name: /Create Account/i,
    });

    await user.type(usernameInput, "testuser");
    await user.type(emailInput, "test@user.com");
    await user.type(passwordInput, "short");
    await user.type(confirmPasswordInput, "short");
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/Password must be at least 8 characters long/i)
      ).toBeInTheDocument();
    });
  });

  it("shows error message on failed registration", async () => {
    const user = userEvent.setup();
    vi.mocked(AuthService.register).mockResolvedValue({
      data: null,
      error: "Username already exists",
    });

    renderRegister();

    await waitFor(() => {
      expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
    });

    const usernameInput = screen.getByLabelText(/Username/i);
    const emailInput = screen.getByLabelText(/Email Address/i);
    const passwordInput = screen.getByLabelText(/^Password$/i);
    const confirmPasswordInput = screen.getByLabelText(/Confirm Password/i);
    const submitButton = screen.getByRole("button", {
      name: /Create Account/i,
    });

    await user.type(usernameInput, "existinguser");
    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "testpass123");
    await user.type(confirmPasswordInput, "testpass123");

    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Username already exists/i)).toBeInTheDocument();
    });
  });

  it("calls register service with correct data", async () => {
    const user = userEvent.setup();
    const mockResponse = {
      detail:
        "User created successfully. A superuser must assign groups to grant access.",
      user: {
        id: 1,
        username: "newuser",
        email: "newuser@example.com",
        first_name: "New",
        last_name: "User",
      },
    };

    vi.mocked(AuthService.register).mockResolvedValue({
      data: mockResponse,
    });

    renderRegister();

    await waitFor(() => {
      expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
    });

    const usernameInput = screen.getByLabelText(/Username/i);
    const emailInput = screen.getByLabelText(/Email Address/i);
    const passwordInput = screen.getByLabelText(/^Password$/i);
    const confirmPasswordInput = screen.getByLabelText(/Confirm Password/i);
    const firstNameInput = screen.getByLabelText(/First Name/i);
    const lastNameInput = screen.getByLabelText(/Last Name/i);
    const submitButton = screen.getByRole("button", {
      name: /Create Account/i,
    });

    await user.type(usernameInput, "newuser");
    await user.type(emailInput, "newuser@example.com");
    await user.type(passwordInput, "testpass123");
    await user.type(confirmPasswordInput, "testpass123");
    await user.type(firstNameInput, "New");
    await user.type(lastNameInput, "User");

    await user.click(submitButton);

    await waitFor(() => {
      expect(AuthService.register).toHaveBeenCalledWith(
        "newuser",
        "testpass123",
        "newuser@example.com",
        "New",
        "User"
      );
    });
  });

  it("redirects to login page on successful registration", async () => {
    const user = userEvent.setup();
    const mockResponse = {
      detail: "User created successfully.",
      user: {
        id: 1,
        username: "newuser",
        email: "newuser@example.com",
      },
    };

    vi.mocked(AuthService.register).mockResolvedValue({
      data: mockResponse,
    });

    renderRegister();

    await waitFor(() => {
      expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
    });

    const usernameInput = screen.getByLabelText(/Username/i);
    const emailInput = screen.getByLabelText(/Email Address/i);
    const passwordInput = screen.getByLabelText(/^Password$/i);
    const confirmPasswordInput = screen.getByLabelText(/Confirm Password/i);
    const submitButton = screen.getByRole("button", {
      name: /Create Account/i,
    });

    await user.type(usernameInput, "newuser");
    await user.type(emailInput, "newuser@example.com");
    await user.type(passwordInput, "testpass123");
    await user.type(confirmPasswordInput, "testpass123");

    await user.click(submitButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/login", {
        state: {
          message: "Account created successfully! Please sign in.",
        },
      });
    });
  });

  it("allows registration without optional first and last name", async () => {
    const user = userEvent.setup();
    const mockResponse = {
      detail: "User created successfully.",
      user: {
        id: 1,
        username: "minimaluser",
        email: "minimal@example.com",
      },
    };

    vi.mocked(AuthService.register).mockResolvedValue({
      data: mockResponse,
    });

    renderRegister();

    await waitFor(() => {
      expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
    });

    const usernameInput = screen.getByLabelText(/Username/i);
    const emailInput = screen.getByLabelText(/Email Address/i);
    const passwordInput = screen.getByLabelText(/^Password$/i);
    const confirmPasswordInput = screen.getByLabelText(/Confirm Password/i);
    const submitButton = screen.getByRole("button", {
      name: /Create Account/i,
    });

    await user.type(usernameInput, "minimaluser");
    await user.type(emailInput, "minimal@example.com");
    await user.type(passwordInput, "testpass123");
    await user.type(confirmPasswordInput, "testpass123");

    await user.click(submitButton);

    await waitFor(() => {
      expect(AuthService.register).toHaveBeenCalledWith(
        "minimaluser",
        "testpass123",
        "minimal@example.com",
        "",
        ""
      );
    });
  });

  it("disables form fields and button while loading", async () => {
    const user = userEvent.setup();
    let resolveRegister;
    const registerPromise = new Promise((resolve) => {
      resolveRegister = resolve;
    });

    vi.mocked(AuthService.register).mockReturnValue(registerPromise);

    renderRegister();

    await waitFor(() => {
      expect(screen.getByLabelText(/Username/i)).toBeInTheDocument();
    });

    const usernameInput = screen.getByLabelText(/Username/i);
    const emailInput = screen.getByLabelText(/Email Address/i);
    const passwordInput = screen.getByLabelText(/^Password$/i);
    const confirmPasswordInput = screen.getByLabelText(/Confirm Password/i);
    const submitButton = screen.getByRole("button", {
      name: /Create Account/i,
    });

    await user.type(usernameInput, "newuser");
    await user.type(emailInput, "newuser@example.com");
    await user.type(passwordInput, "testpass123");
    await user.type(confirmPasswordInput, "testpass123");

    // Click button to trigger async state updates
    await user.click(submitButton);

    await waitFor(() => {
      expect(submitButton).toBeDisabled();
      expect(usernameInput).toBeDisabled();
      expect(emailInput).toBeDisabled();
      expect(passwordInput).toBeDisabled();
      expect(confirmPasswordInput).toBeDisabled();
      expect(screen.getByText(/Creating account.../i)).toBeInTheDocument();
    });

    // Resolve the promise
    const registerData = {
      data: {
        detail: "User created successfully.",
        user: { id: 1, username: "newuser" },
      },
    };

    resolveRegister(registerData);

    // Wait for the promise to resolve and state to update
    await waitFor(
      () => {
        expect(submitButton).not.toBeDisabled();
      },
      { timeout: 100 }
    );
  });

  it("shows link to login page", async () => {
    renderRegister();

    await waitFor(() => {
      expect(
        screen.getByRole("link", { name: /Sign in/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: /Sign in/i }).getAttribute("href")
      ).toBe("/login");
    });
  });
});
