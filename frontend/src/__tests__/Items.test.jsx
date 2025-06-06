import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import axios from "axios";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useNavigate } from "react-router";
import Items from "../pages/Items";
import { mockCategories, mockItems } from "./testUtils";

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

const baseMockGet = (url) => {
  if (url.includes("categories")) {
    return Promise.resolve({ data: mockCategories });
  }
  if (url.includes("items")) {
    return Promise.resolve({ data: mockItems });
  }
  return Promise.reject(new Error("Unknown API endpoint: " + url));
};

const mockEmptyItemsGet = (url) => {
  if (url.includes("categories")) {
    return Promise.resolve({ data: mockCategories });
  }
  if (url.includes("items")) {
    return Promise.resolve({ data: { count: 0, results: [] } });
  }
  return Promise.reject(new Error("Unknown API endpoint: " + url));
};

const mockFilteredItemsGet = (url) => {
  if (url.endsWith("categories/")) {
    return Promise.resolve({ data: mockCategories });
  }
  if (url.includes("search=Dress")) {
    return Promise.resolve({
      data: {
        count: 1,
        results: [mockItems.results[0]],
      },
    });
  }
  if (url.includes("category=COS")) {
    return Promise.resolve({
      data: {
        count: 1,
        results: [mockItems.results[0]],
      },
    });
  }
  if (url.includes("items")) {
    return Promise.resolve({ data: mockItems });
  }
  return Promise.reject(new Error("Unknown API endpoint: " + url));
};

const mockPaginatedGet = (url) => {
  if (url.includes("categories")) {
    return Promise.resolve({ data: mockCategories });
  }
  if (url.includes("page=1") || !url.includes("page=")) {
    // Default to page 1 if no page param
    return Promise.resolve({
      data: {
        count: 20,
        results: Array.from({ length: 10 }, (_, i) => ({
          id: i + 1,
          name: `Item ${i + 1}`,
          category: "COS",
          category_long: "Costumes",
          quantity: 1,
          color: "Red",
          location: "Shelf A",
          checked_out: false,
          in_repair: false,
        })),
      },
    });
  }
  if (url.includes("page=2")) {
    return Promise.resolve({
      data: {
        count: 20,
        results: Array.from({ length: 10 }, (_, i) => ({
          id: i + 11,
          name: `Item ${i + 11}`,
          category: "WIG",
          category_long: "Wigs",
          quantity: 2,
          color: "Blonde",
          location: "Shelf B",
          checked_out: false,
          in_repair: false,
        })),
      },
    });
  }
  return Promise.reject(new Error("Unknown API endpoint: " + url));
};

const renderItemsPage = () =>
  render(
    <MemoryRouter>
      <Items />
    </MemoryRouter>
  );

describe("Items Page", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    axios.get.mockImplementation(baseMockGet);
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
    axios.get.mockImplementation(mockEmptyItemsGet);
    renderItemsPage();
    await waitFor(() => {
      expect(screen.getByText("No items available")).toBeInTheDocument();
    });
  });

  it("applies the search filter and updates the table", async () => {
    axios.get.mockImplementation(mockFilteredItemsGet);
    renderItemsPage();

    await waitFor(() => {
      expect(screen.getByText("80s Wig")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText("Search items...");
    await user.type(searchInput, "Dress");

    await waitFor(() => {
      const table = screen.getByTestId("items-table");
      expect(within(table).getByText("Fancy Dress")).toBeInTheDocument();
    });

    expect(screen.queryByText("80s Wig")).not.toBeInTheDocument();
  });

  it("applies category filter and updates the table", async () => {
    axios.get.mockImplementation(mockFilteredItemsGet);
    renderItemsPage();

    // Wait for initial items
    await waitFor(() => {
      expect(screen.getByText("80s Wig")).toBeInTheDocument();
    });

    const categorySelect = screen.getByTestId("category-select");
    await user.selectOptions(categorySelect, "Costumes");

    await waitFor(() => {
      const table = screen.getByTestId("items-table");
      expect(within(table).getByText("Fancy Dress")).toBeInTheDocument();
    });

    // Ensure non-matching item is not in the table
    expect(screen.queryByText("80s Wig")).not.toBeInTheDocument();
  });

  it("fetches and displays next page of items when Next button or page number is clicked", async () => {
    axios.get.mockImplementation(mockPaginatedGet);

    renderItemsPage();

    // Wait for page 1 items
    await waitFor(() => {
      expect(screen.getByText("Item 1")).toBeInTheDocument();
      expect(screen.getByText("Item 10")).toBeInTheDocument();
    });

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

    // Click on page number 1 button
    const page1Button = screen.getByRole("button", { name: "1" });
    await user.click(page1Button);

    // Wait for page 1 items to render
    await waitFor(() => {
      expect(screen.getByText("Item 1")).toBeInTheDocument();
      expect(screen.getByText("Item 7")).toBeInTheDocument();
    });

    // Confirm page 1 items are gone
    expect(screen.queryByText("Item 14")).not.toBeInTheDocument();
  });

  it("renders loading spinner when loading is true", () => {
    // Mock axios.get to return unresolved promises so loading stays true
    axios.get.mockImplementation(() => new Promise(() => {}));

    renderItemsPage();

    // Expect spinner and loading text to show up
    expect(screen.getByText(/loading items/i)).toBeInTheDocument();
    // Flowbite spinner component uses role="status" for accessibility
    expect(screen.getByRole("status")).toBeInTheDocument();
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
    axios.get.mockImplementation((url) => {
      if (url.includes("categories")) {
        return Promise.resolve({ data: mockCategories });
      }
      if (url.includes("items")) {
        return Promise.reject(new Error("Network Error"));
      }
      return Promise.reject(new Error("Unknown endpoint"));
    });

    renderItemsPage();

    await waitFor(() => {
      expect(screen.getByText(/failed to load items/i)).toBeInTheDocument();
    });
  });

  it("disables category select and shows fallback text if categories fetch fails", async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes("categories")) {
        return Promise.reject(new Error("Categories fetch failed"));
      }
      if (url.includes("items")) {
        return Promise.resolve({ data: mockItems });
      }
      return Promise.reject(new Error("Unknown API endpoint: " + url));
    });

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
  });

  it("clears search input via clear button and resets item table", async () => {
    axios.get.mockImplementation(mockFilteredItemsGet);

    renderItemsPage();

    // Wait for initial unfiltered data (80s Wig present)
    await waitFor(() => {
      expect(screen.getByText("80s Wig")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText("Search items...");
    await user.type(searchInput, "Dress");

    // Wait for filtered result (Fancy Dress only)
    await waitFor(() => {
      expect(screen.getByText("Fancy Dress")).toBeInTheDocument();
    });

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
    axios.get.mockImplementation(mockPaginatedGet);
    renderItemsPage();

    await waitFor(() => {
      expect(screen.getByText("Item 1")).toBeInTheDocument();
    });

    const prevButton = screen.getByRole("button", { name: /previous/i });
    const nextButton = screen.getByRole("button", { name: /next/i });

    // On first page: previous disabled, next enabled
    expect(prevButton).toBeDisabled();
    expect(nextButton).toBeEnabled();

    await user.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText("Item 11")).toBeInTheDocument();
    });

    // On second (last) page: next disabled, previous enabled
    expect(prevButton).toBeEnabled();
    expect(nextButton).toBeDisabled();
  });
});
