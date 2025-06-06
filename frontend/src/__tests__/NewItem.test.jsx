import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import axios from "axios";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useNavigate } from "react-router";
import NewItem from "../pages/NewItem";
import { mockCategories, mockFormData } from "./testUtils";

vi.mock("axios");

// Mock useNavigate from react-router
vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

const mockNavigate = vi.fn();

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
  const user = userEvent.setup();

  beforeEach(() => {
    axios.get.mockResolvedValue({ data: mockCategories });
    useNavigate.mockReturnValue(mockNavigate);
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
    expect(screen.getByLabelText("Checked Out")).toBeInTheDocument();
    expect(screen.getByLabelText("In Repair")).toBeInTheDocument();
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

    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining("items/categories/")
    );
  });

  it("handles form input changes correctly", async () => {
    renderNewItemPage();

    const nameInput = screen.getByLabelText("Name");
    const descriptionInput = screen.getByLabelText("Description");
    const imageInput = screen.getByLabelText("Image URL");
    const quantityInput = screen.getByLabelText("Quantity");
    const colorInput = screen.getByLabelText("Color");
    const locationInput = screen.getByLabelText("Location");
    const checkedOutCheckbox = screen.getByLabelText("Checked Out");
    const inRepairCheckbox = screen.getByLabelText("In Repair");

    await user.type(nameInput, mockFormData.name);
    await user.type(descriptionInput, mockFormData.description);
    await user.type(imageInput, mockFormData.image);
    await user.clear(quantityInput);
    await user.type(quantityInput, mockFormData.quantity.toString());
    await user.type(colorInput, mockFormData.color);
    await user.type(locationInput, mockFormData.location);
    await user.click(checkedOutCheckbox);
    await user.click(inRepairCheckbox);

    expect(nameInput.value).toBe(mockFormData.name);
    expect(descriptionInput.value).toBe(mockFormData.description);
    expect(imageInput.value).toBe(mockFormData.image);
    expect(quantityInput.value).toBe(mockFormData.quantity);
    expect(colorInput.value).toBe(mockFormData.color);
    expect(locationInput.value).toBe(mockFormData.location);
    expect(checkedOutCheckbox.checked).toBe(true);
    expect(inRepairCheckbox.checked).toBe(true);
  });

  it("submits the form successfully and navigates to items page", async () => {
    renderNewItemPage();
    axios.post.mockResolvedValueOnce({});

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
      mockFormData.quantity.toString()
    );
    await user.type(screen.getByLabelText("Color"), mockFormData.color);
    await user.type(screen.getByLabelText("Location"), mockFormData.location);

    if (mockFormData.checked_out) {
      await user.click(screen.getByLabelText("Checked Out"));
    }
    if (mockFormData.in_repair) {
      await user.click(screen.getByLabelText("In Repair"));
    }

    const submitButton = screen.getByRole("button", { name: "Add Item" });
    await user.click(submitButton);

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining("items/"),
        expect.objectContaining({
          name: mockFormData.name,
          description: mockFormData.description,
          image: mockFormData.image,
          category: mockFormData.category,
          quantity: mockFormData.quantity,
          color: mockFormData.color,
          location: mockFormData.location,
          checked_out: mockFormData.checked_out,
          in_repair: mockFormData.in_repair,
        })
      );
    });

    expect(mockNavigate).toHaveBeenCalledWith("/items");
  });

  it("handles form submission error and navigates back to add new item page on button click", async () => {
    renderNewItemPage();
    const mockError = new Error("Failed to create item");
    axios.post.mockRejectedValueOnce(mockError);

    await user.type(screen.getByLabelText("Name"), mockFormData.name);
    await user.click(screen.getByRole("button", { name: "Add Item" }));

    await waitFor(() => {
      expect(
        screen.getByText("Failed to create item. Please try again later.")
      ).toBeInTheDocument();
    });

    const backButton = screen.getByRole("button", {
      name: "← Back to Add New Item",
    });
    await user.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith("/items/new");
  });

  it("navigates back to items page when Cancel is clicked", async () => {
    renderNewItemPage();

    const cancelButton = screen.getByRole("button", { name: "Cancel" });
    await user.click(cancelButton);

    expect(mockNavigate).toHaveBeenCalledWith("/items");
  });

  it("renders form even if fetching categories fails", async () => {
    axios.get.mockRejectedValueOnce(new Error("Network error"));

    renderNewItemPage();

    // Check Name input exists immediately
    expect(screen.getByLabelText("Name")).toBeInTheDocument();

    // Wait for category select to render after effect runs
    await waitFor(() => {
      expect(screen.getByLabelText("Category")).toBeInTheDocument();
    });

    // Assert that the Select has the fallback option
    expect(screen.getByText("Categories unavailable")).toBeInTheDocument();
  });

  it("toggles checkboxes correctly", async () => {
    renderNewItemPage();

    const checkedOutCheckbox = screen.getByLabelText("Checked Out");
    const inRepairCheckbox = screen.getByLabelText("In Repair");

    await user.click(checkedOutCheckbox);
    await user.click(inRepairCheckbox);

    expect(checkedOutCheckbox.checked).toBe(true);
    expect(inRepairCheckbox.checked).toBe(true);
  });

  it("prevents form submission if required fields are empty", async () => {
    renderNewItemPage();

    await waitFor(() => {
      expect(screen.getByText("Add New Item")).toBeInTheDocument();
    });

    const nameInput = screen.getByLabelText(/name/i);
    await user.clear(nameInput);

    const quantityInput = screen.getByLabelText(/quantity/i);
    await user.clear(quantityInput);

    const submitButton = screen.getByRole("button", { name: /add item/i });
    await user.click(submitButton);

    expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
    expect(
      await screen.findByText(/quantity must be at least 1/i)
    ).toBeInTheDocument();
  });
});
