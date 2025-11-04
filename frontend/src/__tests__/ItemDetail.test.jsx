import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useNavigate, useParams } from "react-router";
import ItemDetail from "../pages/ItemDetail";
import { mockItem } from "./testUtils";
import { getItem, deleteItem } from "../services/ItemDetailService";

// Mock service module
vi.mock("../services/ItemDetailService", () => ({
  getItem: vi.fn(),
  deleteItem: vi.fn(),
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

function getVisibleModalByTestId(testId) {
  const modals = screen.queryAllByTestId(testId);
  return modals.find((modal) => {
    return (
      window.getComputedStyle(modal).display !== "none" &&
      !modal.classList.contains("hidden")
    );
  });
}

const renderItemDetailPage = () =>
  render(
    <MemoryRouter>
      <ItemDetail />
    </MemoryRouter>
  );

describe("ItemDetail Page", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    useNavigate.mockReturnValue(mockNavigate);
    useParams.mockReturnValue({ id: "1" });
    getItem.mockResolvedValue({ data: mockItem });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading spinner when loading is true", async () => {
    getItem.mockImplementation(() => new Promise(() => {}));
    renderItemDetailPage();

    await waitFor(() => {
      // Expect spinner and loading text to show up
      expect(screen.getByText(/loading item/i)).toBeInTheDocument();
      // Flowbite spinner component uses role="status" for accessibility
      expect(screen.getByRole("status")).toBeInTheDocument();
    });
  });

  it("fetches and displays item details", async () => {
    renderItemDetailPage();

    await waitFor(() => {
      // Check item name as header
      expect(screen.getByText("Fancy Dress")).toBeInTheDocument();

      // Check all item details are displayed
      expect(screen.getByText("Costumes")).toBeInTheDocument();
      expect(screen.getByText("5")).toBeInTheDocument();
      expect(screen.getByText("Red")).toBeInTheDocument();
      expect(screen.getByText("Shelf A")).toBeInTheDocument();
    });

    // Verify API call
    expect(getItem).toHaveBeenCalledWith("1");
  });

  it("displays item image when available", async () => {
    renderItemDetailPage();

    await waitFor(() => {
      const image = screen.getByAltText("Fancy Dress");
      expect(image).toBeInTheDocument();
      expect(image.src).toBe("http://example.com/image1.jpg");
    });
  });

  it("displays description when available", async () => {
    renderItemDetailPage();

    await waitFor(() => {
      expect(
        screen.getByText("Beautifully made gothic dress")
      ).toBeInTheDocument();
    });
  });

  it('displays "No description available" when description is empty', async () => {
    const itemWithoutDesc = { ...mockItem, description: "" };
    getItem.mockResolvedValueOnce({ data: itemWithoutDesc });

    renderItemDetailPage();

    await waitFor(() => {
      expect(screen.getByText("No description available.")).toBeInTheDocument();
    });
  });

  it("handles API error when fetching item", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    getItem.mockRejectedValueOnce(new Error("Failed to fetch"));

    renderItemDetailPage();

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error fetching item:",
        expect.any(Error)
      );
      // Also check that the error message appears in the UI
      expect(
        screen.getByText("Failed to load item details. Please try again later.")
      ).toBeInTheDocument();
    });

    consoleErrorSpy.mockRestore();
  });

  it("opens delete confirmation modal when Delete button is clicked", async () => {
    renderItemDetailPage();

    // Wait for the initial content to appear
    await waitFor(() => {
      expect(screen.getByText("Fancy Dress")).toBeInTheDocument();
    });

    // Click the delete button
    const deleteButton = screen.getByRole("button", { name: "Delete Item" });
    await user.click(deleteButton);

    // Get the modal by its test ID
    const modal = await waitFor(() => getVisibleModalByTestId("delete-modal"));

    // Scope queries to inside the modal
    const { getByText, getByRole } = within(modal);

    expect(getByText(/Are you sure you want to delete/)).toBeInTheDocument();
    expect(getByText(/Fancy Dress/)).toBeInTheDocument();
    expect(getByRole("button", { name: "Yes, I'm sure" })).toBeInTheDocument();
    expect(getByRole("button", { name: "No, cancel" })).toBeInTheDocument();
  });

  it("closes delete modal when cancel is clicked", async () => {
    renderItemDetailPage();

    await waitFor(() => {
      expect(screen.getByText("Fancy Dress")).toBeInTheDocument();
    });

    // Open modal
    await user.click(screen.getByRole("button", { name: "Delete Item" }));
    expect(
      screen.getByText(/Are you sure you want to delete/)
    ).toBeInTheDocument();

    // Close modal
    await user.click(screen.getByRole("button", { name: "No, cancel" }));
    await waitFor(() => {
      expect(
        screen.queryByText(/Are you sure you want to delete/)
      ).not.toBeInTheDocument();
    });
  });

  it("deletes item and navigates to items page when confirmed", async () => {
    deleteItem.mockResolvedValueOnce({});
    renderItemDetailPage();

    await waitFor(() => {
      expect(screen.getByText("Fancy Dress")).toBeInTheDocument();
    });

    // Open modal and confirm deletion
    await user.click(screen.getByRole("button", { name: "Delete Item" }));
    await user.click(screen.getByRole("button", { name: "Yes, I'm sure" }));

    await waitFor(() => {
      expect(deleteItem).toHaveBeenCalledWith("1");
      expect(mockNavigate).toHaveBeenCalledWith("/items");
    });
  });

  it("handles delete API error", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    deleteItem.mockRejectedValueOnce(new Error("Failed to delete"));

    renderItemDetailPage();

    await waitFor(() => {
      expect(screen.getByText("Fancy Dress")).toBeInTheDocument();
    });

    // Open modal and confirm deletion
    await user.click(screen.getByRole("button", { name: "Delete Item" }));
    await user.click(screen.getByRole("button", { name: "Yes, I'm sure" }));

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error deleting item:",
        expect.any(Error)
      );
      expect(
        screen.getByText("Failed to delete item. Please try again later.")
      ).toBeInTheDocument();
    });

    consoleErrorSpy.mockRestore();
  });

  it("navigates to edit page when Edit button is clicked", async () => {
    renderItemDetailPage();

    await waitFor(() => {
      expect(screen.getByText("Fancy Dress")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Edit Item" }));
    expect(mockNavigate).toHaveBeenCalledWith("/items/1/edit");
  });

  it("navigates back to items page when Back button is clicked", async () => {
    renderItemDetailPage();

    await waitFor(() => {
      expect(screen.getByText("Fancy Dress")).toBeInTheDocument();
    });

    const backButton = screen.getByRole("button", { name: "← Back to Items" });
    await user.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith("/items");
  });
});
