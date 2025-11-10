import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useNavigate } from "react-router";
import Items from "../pages/Items";
import { mockCategories, mockItems } from "./testUtils";
import { getCategories, getItems } from "../services/ItemsService";

// Mock service module
vi.mock("../services/ItemsService", () => ({
  getCategories: vi.fn(),
  getItems: vi.fn(),
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

const renderItemsPage = () =>
  render(
    <MemoryRouter>
      <Items />
    </MemoryRouter>
  );

describe("Items Page", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    getCategories.mockResolvedValue({ data: mockCategories });
    getItems.mockResolvedValue({ data: mockItems.results, pageCount: 1 });
    useNavigate.mockReturnValue(mockNavigate);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("fetches and displays items with category_long in the table", async () => {
    renderItemsPage();
    await waitFor(() => {
      const table = screen.getByTestId("items-table");
      expect(within(table).getByText("Costumes")).toBeInTheDocument();
      expect(within(table).getByText("Wigs")).toBeInTheDocument();
      expect(within(table).getByText("Fancy Dress")).toBeInTheDocument();
      expect(within(table).getByText("80s Wig")).toBeInTheDocument();
      expect(within(table).getByText("Red")).toBeInTheDocument();
      expect(within(table).getByText("Blonde")).toBeInTheDocument();
      expect(within(table).getByText("Shelf A")).toBeInTheDocument();
      expect(within(table).getByText("Shelf B")).toBeInTheDocument();
      expect(within(table).getByText("5")).toBeInTheDocument();
      expect(within(table).getByText("2")).toBeInTheDocument();
    });
  });

  it("fetches and displays category options in the select dropdown", async () => {
    renderItemsPage();

    await waitFor(() => {
      const select = screen.getByTestId("category-select");
      expect(within(select).getByText("Costumes")).toBeInTheDocument();
      expect(within(select).getByText("Wigs")).toBeInTheDocument();
    });
  });

  it("displays 'No items available' message when there are no items", async () => {
    getItems.mockResolvedValueOnce({ data: [], pageCount: 0 });
    renderItemsPage();
    await waitFor(() => {
      expect(screen.getByText("No items available")).toBeInTheDocument();
    });
  });

  it("applies the search filter and updates the table", async () => {
    // Initial load with all items
    getItems.mockResolvedValueOnce({ data: mockItems.results, pageCount: 1 });

    renderItemsPage();

    await waitFor(() => {
      expect(screen.getByText("80s Wig")).toBeInTheDocument();
    });

    // Mock filtered results for all calls after search is applied
    // (user.type triggers multiple calls as each character is typed)
    getItems.mockResolvedValue({
      data: [mockItems.results[0]],
      pageCount: 1,
    });

    const searchInput = screen.getByPlaceholderText("Search items...");
    await user.type(searchInput, "Dress");

    await waitFor(() => {
      const table = screen.getByTestId("items-table");
      expect(within(table).getByText("Fancy Dress")).toBeInTheDocument();
      // Ensure non-matching item is removed from the table
      expect(screen.queryByText("80s Wig")).not.toBeInTheDocument();
    });
  });

  it("applies category filter and updates the table", async () => {
    // Initial load with all items
    getItems.mockResolvedValueOnce({ data: mockItems.results, pageCount: 1 });

    renderItemsPage();

    // Wait for initial items
    await waitFor(() => {
      expect(screen.getByText("80s Wig")).toBeInTheDocument();
    });

    // Mock filtered results when category is selected
    getItems.mockResolvedValue({
      data: [mockItems.results[0]],
      pageCount: 1,
    });

    const categorySelect = screen.getByTestId("category-select");
    await user.selectOptions(categorySelect, "1");

    await waitFor(() => {
      const table = screen.getByTestId("items-table");
      expect(within(table).getByText("Fancy Dress")).toBeInTheDocument();
      // Ensure non-matching item is not in the table
      expect(screen.queryByText("80s Wig")).not.toBeInTheDocument();
    });
  });

  it("fetches and displays next page of items when Next button or page number is clicked", async () => {
    const page1Items = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      name: `Item ${i + 1}`,
      category: 1,
      category_long: "Costumes",
      quantity: 1,
      color: "Red",
      location: "Shelf A",
    }));

    const page2Items = Array.from({ length: 10 }, (_, i) => ({
      id: i + 11,
      name: `Item ${i + 11}`,
      category: 2,
      category_long: "Wigs",
      quantity: 2,
      color: "Blonde",
      location: "Shelf B",
    }));

    // Initial load with page 1 items
    getItems.mockResolvedValueOnce({ data: page1Items, pageCount: 2 });

    renderItemsPage();

    // Wait for page 1 items
    await waitFor(() => {
      expect(screen.getByText("Item 1")).toBeInTheDocument();
      expect(screen.getByText("Item 10")).toBeInTheDocument();
    });

    // Mock page 2 items
    getItems.mockResolvedValueOnce({ data: page2Items, pageCount: 2 });

    // Click Next button in pagination
    const nextButton = screen.getByRole("button", { name: /next/i });
    await user.click(nextButton);

    // Wait for page 2 items
    await waitFor(() => {
      expect(screen.getByText("Item 11")).toBeInTheDocument();
      expect(screen.getByText("Item 20")).toBeInTheDocument();
    });

    // Assert page 1 items are gone
    expect(screen.queryByText("Item 1")).not.toBeInTheDocument();

    // Mock page 1 items again
    getItems.mockResolvedValueOnce({ data: page1Items, pageCount: 2 });

    // Click on page number 1 button
    const page1Button = screen.getByRole("button", { name: "1" });
    await user.click(page1Button);

    // Wait for page 1 items to render
    await waitFor(() => {
      expect(screen.getByText("Item 1")).toBeInTheDocument();
      expect(screen.getByText("Item 7")).toBeInTheDocument();
    });

    // Confirm page 2 items are gone
    expect(screen.queryByText("Item 14")).not.toBeInTheDocument();
  });

  it("renders loading spinner when loading is true", async () => {
    // Mock getItems to return unresolved promise so loading stays true
    getItems.mockImplementation(() => new Promise(() => {}));

    renderItemsPage();

    await waitFor(() => {
      // Expect spinner and loading text to show up
      expect(screen.getByText(/loading items/i)).toBeInTheDocument();
      // Flowbite spinner component uses role="status" for accessibility
      expect(screen.getByRole("status")).toBeInTheDocument();
    });
  });

  it("navigates to item detail page when a table row is clicked", async () => {
    renderItemsPage();

    // Wait for the table to render items
    await waitFor(() => {
      expect(screen.getByText("Fancy Dress")).toBeInTheDocument();
      expect(screen.getByText("80s Wig")).toBeInTheDocument();
    });

    // Click the row for item with id 1
    await user.click(screen.getByTestId("item-row-1"));
    expect(mockNavigate).toHaveBeenCalledWith("/items/1");

    // Click the row for item with id 2
    await user.click(screen.getByTestId("item-row-2"));
    expect(mockNavigate).toHaveBeenCalledWith("/items/2");
  });

  it("displays error message when API call fails", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    getItems.mockResolvedValueOnce({
      errorKey: "LOAD_ITEMS_FAILED",
      error: new Error("Network Error"),
    });

    renderItemsPage();

    await waitFor(() => {
      expect(screen.getByText(/failed to load items/i)).toBeInTheDocument();
    });

    consoleErrorSpy.mockRestore();
  });

  it("disables category select and shows fallback text if categories fetch fails", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    getCategories.mockResolvedValueOnce({
      errorKey: "LOAD_CATEGORIES_FAILED",
      error: new Error("Categories fetch failed"),
    });
    getItems.mockResolvedValueOnce({ data: mockItems.results, pageCount: 1 });

    renderItemsPage();

    // Wait for items to load
    await waitFor(() => {
      expect(screen.getByText("Fancy Dress")).toBeInTheDocument();
    });

    const categorySelect = screen.getByTestId("category-select");
    expect(categorySelect).toBeDisabled();
    expect(
      within(categorySelect).getByText("Categories unavailable")
    ).toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });

  it("clears search input via clear button and resets item table", async () => {
    // Initial load with all items
    getItems.mockResolvedValueOnce({ data: mockItems.results, pageCount: 1 });

    renderItemsPage();

    // Wait for initial unfiltered data (80s Wig present)
    await waitFor(() => {
      expect(screen.getByText("80s Wig")).toBeInTheDocument();
    });

    // Mock filtered results when search is applied
    getItems.mockResolvedValueOnce({
      data: [mockItems.results[0]],
      pageCount: 1,
    });

    const searchInput = screen.getByPlaceholderText("Search items...");
    await user.type(searchInput, "Dress");

    // Wait for filtered result (Fancy Dress only)
    await waitFor(() => {
      expect(screen.getByText("Fancy Dress")).toBeInTheDocument();
    });

    // Mock unfiltered results when clear is clicked
    getItems.mockResolvedValueOnce({ data: mockItems.results, pageCount: 1 });

    // Find and click the Clear button
    const clearButton = screen.getByRole("button", { name: /clear filters/i });
    await user.click(clearButton);

    // Wait for table to reset to original unfiltered data
    await waitFor(() => {
      expect(screen.getByText("80s Wig")).toBeInTheDocument();
      expect(screen.getByText("Fancy Dress")).toBeInTheDocument();
    });
  });

  it("disables pagination buttons appropriately", async () => {
    const page1Items = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      name: `Item ${i + 1}`,
      category: 1,
      category_long: "Costumes",
      quantity: 1,
      color: "Red",
      location: "Shelf A",
    }));

    const page2Items = Array.from({ length: 10 }, (_, i) => ({
      id: i + 11,
      name: `Item ${i + 11}`,
      category: 2,
      category_long: "Wigs",
      quantity: 2,
      color: "Blonde",
      location: "Shelf B",
    }));

    // Initial load with page 1 items
    getItems.mockResolvedValueOnce({ data: page1Items, pageCount: 2 });

    renderItemsPage();

    await waitFor(() => {
      expect(screen.getByText("Item 1")).toBeInTheDocument();
    });

    const prevButton = screen.getByRole("button", { name: /previous/i });
    const nextButton = screen.getByRole("button", { name: /next/i });

    // On first page: previous disabled, next enabled
    expect(prevButton).toBeDisabled();
    expect(nextButton).toBeEnabled();

    // Mock page 2 items
    getItems.mockResolvedValueOnce({ data: page2Items, pageCount: 2 });

    await user.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText("Item 11")).toBeInTheDocument();
    });

    // On second (last) page: next disabled, previous enabled
    expect(prevButton).toBeEnabled();
    expect(nextButton).toBeDisabled();
  });
});
