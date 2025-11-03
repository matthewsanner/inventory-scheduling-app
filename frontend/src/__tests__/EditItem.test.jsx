import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useNavigate, useParams } from "react-router";
import EditItem from "../pages/EditItem";
import { mockCategories, mockItem } from "./testUtils";
import {
  fetchCategories,
  fetchItemById,
  updateItem,
} from "../services/EditItemService";

// Mock service module
vi.mock("../services/EditItemService", () => ({
  fetchCategories: vi.fn(),
  fetchItemById: vi.fn(),
  updateItem: vi.fn(),
}));

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
const user = userEvent.setup();

// const mockCategoryFailure = () => {
//   axios.get.mockImplementation((url) => {
//     if (url.includes("categories")) {
//       return Promise.reject(new Error("Failed to fetch categories"));
//     }
//     if (url.includes("items/1")) {
//       return Promise.resolve({ data: mockItem });
//     }
//     return Promise.reject(new Error("Invalid URL"));
//   });
// };

const renderEditItemPage = async () => {
  render(
    <MemoryRouter>
      <EditItem />
    </MemoryRouter>
  );
};

describe("EditItem Page", () => {
  beforeEach(() => {
    useNavigate.mockReturnValue(mockNavigate);
    useParams.mockReturnValue({ id: "1" });
    fetchCategories.mockResolvedValue({ data: mockCategories });
    fetchItemById.mockResolvedValue({ data: mockItem });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading spinner initially", async () => {
    fetchItemById.mockImplementation(
      () => new Promise(() => {}) // pending
    );

    render(
      <MemoryRouter>
        <EditItem />
      </MemoryRouter>
    );

    expect(screen.getByText(/loading item/i)).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("fetches and displays item data in the form", async () => {
    renderEditItemPage();

    const heading = await screen.findByRole("heading", { name: /Edit Item/i });
    expect(heading).toBeInTheDocument();

    expect(fetchCategories).toHaveBeenCalled();
    expect(fetchItemById).toHaveBeenCalledWith("1");

    // Check if form fields are populated with item data
    const nameInput = await screen.findByLabelText("Name");
    expect(nameInput).toHaveValue(mockItem.name);
    const descriptionInput = await screen.findByLabelText("Description");
    expect(descriptionInput).toHaveValue(mockItem.description);
    const imageInput = await screen.findByLabelText("Image URL");
    expect(imageInput).toHaveValue(mockItem.image);
    const categorySelect = await screen.findByLabelText("Category");
    expect(categorySelect).toHaveValue(mockItem.category);
    const quantityInput = await screen.findByLabelText("Quantity");
    expect(quantityInput).toHaveValue(mockItem.quantity);
    const colorInput = await screen.findByLabelText("Color");
    expect(colorInput).toHaveValue(mockItem.color);
    const locationInput = await screen.findByLabelText("Location");
    expect(locationInput).toHaveValue(mockItem.location);
  });

  it("fetches and displays category options in the select dropdown", async () => {
    renderEditItemPage();

    await waitFor(async () => {
      const categorySelect = await screen.findByLabelText("Category");
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

    // Get form inputs - await all findByLabelText calls
    const nameInput = await screen.findByLabelText("Name");
    const descriptionInput = await screen.findByLabelText("Description");
    const quantityInput = await screen.findByLabelText("Quantity");
    const categorySelect = await screen.findByLabelText("Category");

    // Test input changes
    await user.clear(nameInput);
    await user.type(nameInput, "Updated Name");
    await user.clear(descriptionInput);
    await user.type(descriptionInput, "Updated description");
    await user.clear(quantityInput);
    await user.type(quantityInput, "10");
    await user.selectOptions(categorySelect, "COS");

    // Verify input values
    expect(nameInput.value).toBe("Updated Name");
    expect(descriptionInput.value).toBe("Updated description");
    expect(Number(quantityInput.value)).toBe(10);
    expect(categorySelect.value).toBe("COS");
  });

  it("handles successful form submission", async () => {
    // Use a delayed promise to allow testing the disabled state
    let resolveUpdate;
    const updatePromise = new Promise((resolve) => {
      resolveUpdate = resolve;
    });
    updateItem.mockReturnValueOnce(updatePromise);

    renderEditItemPage();

    // Update some fields - await all findByLabelText calls
    const nameInput = await screen.findByLabelText("Name");
    const descriptionInput = await screen.findByLabelText("Description");
    const quantityInput = await screen.findByLabelText("Quantity");

    await user.clear(nameInput);
    await user.type(nameInput, "Updated Name");
    await user.clear(descriptionInput);
    await user.type(descriptionInput, "Updated description");
    await user.clear(quantityInput);
    await user.type(quantityInput, "10");

    // Submit the form
    const submitButton = await screen.findByRole("button", {
      name: "Update Item",
    });
    await user.click(submitButton);

    // Wait for button to become disabled on submit
    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });

    // Resolve the promise to complete the submission
    resolveUpdate({});

    // Wait for and verify API call
    await waitFor(() => {
      expect(updateItem).toHaveBeenCalledWith(
        "1",
        expect.objectContaining({
          quantity: "10", // HTML input values are strings
          name: "Updated Name",
          description: "Updated description",
        })
      );
      expect(mockNavigate).toHaveBeenCalledWith("/items");
    });
  });

  it("handles form submission error and shows ErrorCard", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    updateItem.mockRejectedValueOnce(new Error("Update failed"));
    renderEditItemPage();

    // Submit the form without changes - wait for button to be available
    const submitButton = await screen.findByRole("button", {
      name: "Update Item",
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(
          "Failed to update item. Please check your input and try again."
        )
      ).toBeInTheDocument();
    });

    const backButton = screen.getByRole("button", { name: /back/i });
    await user.click(backButton);
    // UPDATE_ITEM_FAILED navigates to /items/{id} (back to item details)
    expect(mockNavigate).toHaveBeenCalledWith("/items/1");

    consoleErrorSpy.mockRestore();
  });

  it("shows ErrorCard and allows navigating back when fetching item data fails", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    fetchCategories.mockResolvedValueOnce({ data: mockCategories });
    fetchItemById.mockRejectedValueOnce(new Error("Failed to fetch item"));

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

    const cancelButton = await screen.findByRole("button", { name: "Cancel" });
    await user.click(cancelButton);

    expect(mockNavigate).toHaveBeenCalledWith("/items");
  });

  it("handles error when fetching categories", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    fetchCategories.mockRejectedValueOnce(
      new Error("Failed to fetch categories")
    );
    fetchItemById.mockResolvedValueOnce({ data: mockItem });

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
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    // Mock categories fetch failure but allow item fetch
    fetchCategories.mockRejectedValueOnce(
      new Error("Failed to fetch categories")
    );
    fetchItemById.mockResolvedValueOnce({ data: mockItem });

    renderEditItemPage();

    const categorySelect = await screen.findByLabelText("Category");
    expect(categorySelect).toBeDisabled();
    expect(screen.getByText("Categories unavailable")).toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });

  it("prevents form submission if required fields are empty", async () => {
    renderEditItemPage();

    const nameInput = await screen.findByLabelText("Name");
    await user.clear(nameInput);

    const quantityInput = await screen.findByLabelText("Quantity");
    await user.clear(quantityInput);

    const submitButton = await screen.findByRole("button", {
      name: "Update Item",
    });
    await user.click(submitButton);

    expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
    expect(
      await screen.findByText(/quantity must be at least 1/i)
    ).toBeInTheDocument();
  });

  it("resets previous errors and shows loading state during submission", async () => {
    fetchCategories.mockResolvedValue({ data: mockCategories });
    fetchItemById.mockResolvedValueOnce({ data: mockItem });

    // Use a delayed promise to allow testing the loading state
    let resolveUpdate;
    const updatePromise = new Promise((resolve) => {
      resolveUpdate = resolve;
    });
    updateItem.mockReturnValueOnce(updatePromise);

    render(
      <MemoryRouter>
        <EditItem />
      </MemoryRouter>
    );

    const nameInput = await screen.findByLabelText("Name");
    const submitButton = await screen.findByRole("button", {
      name: "Update Item",
    });

    // First submit with empty name to cause validation error
    await user.clear(nameInput);
    await user.click(submitButton);
    expect(await screen.findByText(/name is required/i)).toBeInTheDocument();

    // Now fill in name and resubmit
    await user.type(nameInput, "Updated Box");
    await user.click(submitButton);

    // Should reset errors and show loading state
    await waitFor(() => {
      const updatingButton = screen.getByRole("button", {
        name: /updating item/i,
      });
      expect(updatingButton).toBeInTheDocument();
    });

    // Resolve the promise to complete the submission
    resolveUpdate({});

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/items");
    });
  });
});
