import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import axios from "axios";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useNavigate, useParams } from "react-router";
import EditItem from "../pages/EditItem";
import { mockCategories, mockItem } from "./testUtils";

vi.mock("axios");

// Mock useNavigate and useParams from react-router
vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useNavigate: vi.fn(),
    useParams: vi.fn(),
  };
});

const mockNavigate = vi.fn();

const mockCategoryFailure = () => {
  axios.get.mockImplementation((url) => {
    if (url.includes("categories")) {
      return Promise.reject(new Error("Failed to fetch categories"));
    }
    if (url.includes("items/1")) {
      return Promise.resolve({ data: mockItem });
    }
    return Promise.reject(new Error("Invalid URL"));
  });
};

const renderEditItemPage = () =>
  render(
    <MemoryRouter>
      <EditItem />
    </MemoryRouter>
  );

describe("EditItem Page", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    useNavigate.mockReturnValue(mockNavigate);
    useParams.mockReturnValue({ id: "1" });
    // Mock both API calls that happen on component mount
    axios.get.mockImplementation((url) => {
      if (url.includes("categories")) {
        return Promise.resolve({ data: mockCategories });
      }
      if (url.includes("items/1")) {
        return Promise.resolve({ data: mockItem });
      }
      return Promise.reject(new Error("Invalid URL"));
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading spinner when loading is true", () => {
    axios.get.mockImplementation(() => new Promise(() => {}));
    renderEditItemPage();

    // Expect spinner and loading text to show up
    expect(screen.getByText(/loading item/i)).toBeInTheDocument();
    // Flowbite spinner component uses role="status" for accessibility
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("fetches and displays item data in the form", async () => {
    renderEditItemPage();

    await waitFor(() => {
      expect(screen.getByText("Edit Item")).toBeInTheDocument();
    });

    // Check if form fields are populated with item data
    expect(screen.getByLabelText("Name")).toHaveValue(mockItem.name);
    expect(screen.getByLabelText("Description")).toHaveValue(
      mockItem.description
    );
    expect(screen.getByLabelText("Image URL")).toHaveValue(mockItem.image);
    expect(screen.getByLabelText("Category")).toHaveValue(mockItem.category);
    expect(screen.getByLabelText("Quantity")).toHaveValue(mockItem.quantity);
    expect(screen.getByLabelText("Color")).toHaveValue(mockItem.color);
    expect(screen.getByLabelText("Location")).toHaveValue(mockItem.location);
    expect(screen.getByLabelText("Checked Out")).not.toBeChecked();
    expect(screen.getByLabelText("In Repair")).not.toBeChecked();

    // Verify API calls
    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining("categories")
    );
    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining("items/1"));
  });

  it("fetches and displays category options in the select dropdown", async () => {
    renderEditItemPage();

    await waitFor(() => {
      const categorySelect = screen.getByLabelText("Category");
      expect(categorySelect).toBeInTheDocument();

      // Check for default option
      expect(screen.getByText("Select a category")).toBeInTheDocument();

      // Check for fetched category options
      expect(screen.getByText("Costumes")).toBeInTheDocument();
      expect(screen.getByText("Wigs")).toBeInTheDocument();
    });
  });

  it("handles form input changes correctly", async () => {
    renderEditItemPage();

    await waitFor(() => {
      expect(screen.getByText("Edit Item")).toBeInTheDocument();
    });

    // Get form inputs
    const nameInput = screen.getByLabelText("Name");
    const descriptionInput = screen.getByLabelText("Description");
    const quantityInput = screen.getByLabelText("Quantity");
    const checkedOutCheckbox = screen.getByLabelText("Checked Out");

    // Test text input changes
    await user.clear(nameInput);
    await user.type(nameInput, "Updated Name");
    await user.clear(descriptionInput);
    await user.type(descriptionInput, "Updated description");
    await user.clear(quantityInput);
    await user.type(quantityInput, "10");

    // Test checkbox changes
    await user.click(checkedOutCheckbox);

    // Verify input values
    expect(nameInput.value).toBe("Updated Name");
    expect(descriptionInput.value).toBe("Updated description");
    expect(quantityInput.value).toBe("10");
    expect(checkedOutCheckbox.checked).toBe(true);
  });

  it("handles successful form submission", async () => {
    renderEditItemPage();
    axios.put.mockResolvedValueOnce({});

    await waitFor(() => {
      expect(screen.getByText("Edit Item")).toBeInTheDocument();
    });

    // Update some fields
    await user.clear(screen.getByLabelText("Name"));
    await user.type(screen.getByLabelText("Name"), "Updated Name");
    await user.clear(screen.getByLabelText("Description"));
    await user.type(
      screen.getByLabelText("Description"),
      "Updated description"
    );

    // Submit the form
    const submitButton = screen.getByRole("button", { name: "Update Item" });
    await user.click(submitButton);

    // Wait for and verify API call
    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(
        expect.stringContaining("items/1/"),
        expect.objectContaining({
          name: "Updated Name",
          description: "Updated description",
        })
      );
      expect(mockNavigate).toHaveBeenCalledWith("/items");
    });
  });

  it("handles form submission error", async () => {
    renderEditItemPage();
    const mockError = new Error("Failed to update item");
    axios.put.mockRejectedValueOnce(mockError);

    await waitFor(() => {
      expect(screen.getByText("Edit Item")).toBeInTheDocument();
    });

    // Submit the form without changes
    const submitButton = screen.getByRole("button", { name: "Update Item" });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(
          "Failed to update item. Please check your input and try again."
        )
      ).toBeInTheDocument();
    });
  });

  it("shows ErrorCard and allows navigating back when fetching item data fails", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    // Mock axios.get to fail fetching the item but succeed fetching categories
    axios.get.mockImplementation((url) => {
      if (url.includes("categories")) {
        return Promise.resolve({ data: mockCategories });
      }
      if (url.includes("items/1")) {
        return Promise.reject(new Error("Failed to fetch item"));
      }
      return Promise.reject(new Error("Invalid URL"));
    });

    renderEditItemPage();

    // Wait for error to be set and component to render ErrorCard
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error fetching item:",
        expect.any(Error)
      );
      // ErrorCard message should be present in the document
      expect(
        screen.getByText("Failed to load item details. Please try again later.")
      ).toBeInTheDocument();
    });

    // Simulate user clicking the Back button on ErrorCard
    const backButton = screen.getByRole("button", { name: /back/i });
    await user.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith("/items");

    consoleErrorSpy.mockRestore();
  });

  it("navigates back to items page when Cancel is clicked", async () => {
    renderEditItemPage();

    await waitFor(() => {
      expect(screen.getByText("Edit Item")).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole("button", { name: "Cancel" });
    await user.click(cancelButton);

    expect(mockNavigate).toHaveBeenCalledWith("/items");
  });

  it("handles error when fetching categories", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    // Mock the categories fetch to fail
    mockCategoryFailure();
    renderEditItemPage();

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error fetching categories:",
        expect.any(Error)
      );
    });

    consoleErrorSpy.mockRestore();
  });

  it("disables category select and shows message when fetching categories fails", async () => {
    // Mock categories fetch failure but allow item fetch
    mockCategoryFailure();
    renderEditItemPage();

    await waitFor(() => {
      expect(screen.getByText("Edit Item")).toBeInTheDocument();
    });

    const categorySelect = screen.getByLabelText("Category");

    // Should be disabled
    expect(categorySelect).toBeDisabled();

    // Should show "Categories unavailable"
    expect(screen.getByText("Categories unavailable")).toBeInTheDocument();
  });

  it("prevents form submission if required fields are empty", async () => {
    renderEditItemPage();

    await waitFor(() => {
      expect(screen.getByText("Edit Item")).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/name/i);
    await user.clear(nameInput);

    const quantityInput = screen.getByLabelText(/quantity/i);
    await user.clear(quantityInput);

    const submitButton = screen.getByRole("button", { name: /update item/i });
    await user.click(submitButton);

    expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
    expect(
      await screen.findByText(/quantity must be at least 1/i)
    ).toBeInTheDocument();
  });
});
