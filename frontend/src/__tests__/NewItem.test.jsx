import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useNavigate } from "react-router";
import NewItem from "../pages/NewItem";
import { mockCategories, mockFormData } from "./testUtils";
import { getCategories, createItem } from "../services/NewItemService";

// Mock service module
vi.mock("../services/NewItemService", () => ({
  getCategories: vi.fn(),
  createItem: vi.fn(),
}));

// Mock useNavigate from react-router
vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

const mockNavigate = vi.fn();
const user = userEvent.setup();

const renderNewItemPage = async () => {
  render(
    <MemoryRouter>
      <NewItem />
    </MemoryRouter>
  );

  await waitFor(() =>
    expect(screen.getByText("Add New Item")).toBeInTheDocument()
  );
};

describe("NewItem Page", () => {
  beforeEach(() => {
    useNavigate.mockReturnValue(mockNavigate);
    getCategories.mockResolvedValue({ data: mockCategories });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders the form with all required fields", async () => {
    renderNewItemPage();

    expect(screen.getByText("Add New Item")).toBeInTheDocument();

    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Description")).toBeInTheDocument();
    expect(screen.getByLabelText("Image URL")).toBeInTheDocument();
    expect(screen.getByLabelText("Category")).toBeInTheDocument();
    expect(screen.getByLabelText("Quantity")).toBeInTheDocument();
    expect(screen.getByLabelText("Color")).toBeInTheDocument();
    expect(screen.getByLabelText("Location")).toBeInTheDocument();
  });

  it("fetches and displays category options in the select dropdown", async () => {
    renderNewItemPage();

    await waitFor(() => {
      const categorySelect = screen.getByLabelText("Category");
      expect(categorySelect).toBeInTheDocument();
      expect(screen.getByText("Select a category")).toBeInTheDocument();
      expect(screen.getByText("Costumes")).toBeInTheDocument();
      expect(screen.getByText("Wigs")).toBeInTheDocument();
    });

    expect(getCategories).toHaveBeenCalledTimes(1);
  });

  it("handles form input changes correctly", async () => {
    renderNewItemPage();

    const nameInput = screen.getByLabelText("Name");
    const descriptionInput = screen.getByLabelText("Description");
    const imageInput = screen.getByLabelText("Image URL");
    const quantityInput = screen.getByLabelText("Quantity");
    const colorInput = screen.getByLabelText("Color");
    const locationInput = screen.getByLabelText("Location");
    const categorySelect = screen.getByLabelText("Category");

    await user.type(nameInput, mockFormData.name);
    await user.type(descriptionInput, mockFormData.description);
    await user.type(imageInput, mockFormData.image);
    await user.clear(quantityInput);
    await user.type(quantityInput, mockFormData.quantity.toString());
    await user.type(colorInput, mockFormData.color);
    await user.type(locationInput, mockFormData.location);
    await user.selectOptions(categorySelect, mockFormData.category);

    expect(nameInput.value).toBe(mockFormData.name);
    expect(descriptionInput.value).toBe(mockFormData.description);
    expect(imageInput.value).toBe(mockFormData.image);
    expect(quantityInput.value).toBe(mockFormData.quantity);
    expect(colorInput.value).toBe(mockFormData.color);
    expect(locationInput.value).toBe(mockFormData.location);
    expect(categorySelect.value).toBe(mockFormData.category);
  });

  it("submits the form successfully and navigates to items page", async () => {
    renderNewItemPage();
    createItem.mockResolvedValueOnce({});

    await user.type(screen.getByLabelText("Name"), mockFormData.name);
    await user.type(
      screen.getByLabelText("Description"),
      mockFormData.description
    );
    await user.type(screen.getByLabelText("Image URL"), mockFormData.image);
    await user.selectOptions(
      screen.getByLabelText("Category"),
      mockFormData.category
    );
    await user.clear(screen.getByLabelText("Quantity"));
    await user.type(
      screen.getByLabelText("Quantity"),
      String(mockFormData.quantity)
    );
    await user.type(screen.getByLabelText("Color"), mockFormData.color);
    await user.type(screen.getByLabelText("Location"), mockFormData.location);

    const submitButton = screen.getByRole("button", { name: "Add Item" });
    await user.click(submitButton);

    await waitFor(() => {
      expect(createItem).toHaveBeenCalledWith(
        expect.objectContaining({
          name: mockFormData.name,
          description: mockFormData.description,
          image: mockFormData.image,
          category: mockFormData.category,
          quantity: mockFormData.quantity,
          color: mockFormData.color,
          location: mockFormData.location,
        })
      );
    });

    expect(mockNavigate).toHaveBeenCalledWith("/items");
  });

  it("handles form submission error and shows ErrorCard", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    createItem.mockRejectedValueOnce(new Error("API error"));
    renderNewItemPage();

    await user.type(screen.getByLabelText("Name"), mockFormData.name);
    await user.click(screen.getByRole("button", { name: "Add Item" }));

    await waitFor(() => {
      expect(
        screen.getByText("Failed to create item. Please try again later.")
      ).toBeInTheDocument();
    });

    const backButton = screen.getByRole("button", {
      name: "← Back to Items",
    });
    await user.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith("/items");

    consoleErrorSpy.mockRestore();
  });

  it("navigates back to items page when Cancel is clicked", async () => {
    renderNewItemPage();

    const cancelButton = screen.getByRole("button", { name: "Cancel" });
    await user.click(cancelButton);

    expect(mockNavigate).toHaveBeenCalledWith("/items");
  });

  it("renders fallback text when fetching categories fails", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    getCategories.mockRejectedValueOnce(new Error("Network error"));

    renderNewItemPage();

    await waitFor(() => {
      expect(screen.getByLabelText("Category")).toBeInTheDocument();
      expect(screen.getByText("Categories unavailable")).toBeInTheDocument();
    });

    consoleErrorSpy.mockRestore();
  });

  it("prevents form submission if required fields are empty", async () => {
    renderNewItemPage();

    const nameInput = screen.getByLabelText("Name");
    await user.clear(nameInput);

    const quantityInput = screen.getByLabelText("Quantity");
    await user.clear(quantityInput);

    const submitButton = screen.getByRole("button", { name: "Add Item" });
    await user.click(submitButton);

    expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
    expect(
      await screen.findByText(/quantity must be at least 1/i)
    ).toBeInTheDocument();
  });

  it("resets previous errors and shows loading state during submission", async () => {
    // Use a delayed promise to allow testing the loading state
    let resolveCreate;
    const createPromise = new Promise((resolve) => {
      resolveCreate = resolve;
    });
    createItem.mockReturnValueOnce(createPromise);

    renderNewItemPage();

    const nameInput = screen.getByLabelText("Name");
    const submitButton = screen.getByRole("button", { name: "Add Item" });

    // First submit without name, causes validation errors
    await user.click(submitButton);
    expect(await screen.findByText(/name is required/i)).toBeInTheDocument();

    // Now fill and resubmit
    await user.type(nameInput, "Box");
    await user.click(submitButton);

    // Should reset errors and show loading state
    await waitFor(() => {
      const updatedButton = screen.getByRole("button", {
        name: /adding item/i,
      });
      expect(updatedButton).toHaveTextContent(/adding item/i);
    });

    // Resolve the promise to complete the submission
    resolveCreate({});

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/items");
    });
  });
});
