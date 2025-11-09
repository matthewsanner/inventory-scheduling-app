import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useNavigate, useParams } from "react-router";
import EditItemBooking from "../pages/EditItemBooking";
import { mockItemBooking } from "./testUtils";
import {
  fetchItemBookingById,
  updateItemBooking,
  deleteItemBooking,
} from "../services/EditItemBookingService";

// Mock service module
vi.mock("../services/EditItemBookingService", () => ({
  fetchItemBookingById: vi.fn(),
  updateItemBooking: vi.fn(),
  deleteItemBooking: vi.fn(),
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

function getVisibleModalByTestId(testId) {
  const modals = screen.queryAllByTestId(testId);
  return modals.find((modal) => {
    return (
      window.getComputedStyle(modal).display !== "none" &&
      !modal.classList.contains("hidden")
    );
  });
}

const renderEditItemBookingPage = () => {
  render(
    <MemoryRouter>
      <EditItemBooking />
    </MemoryRouter>
  );
};

describe("EditItemBooking Page", () => {
  beforeEach(() => {
    useNavigate.mockReturnValue(mockNavigate);
    useParams.mockReturnValue({ id: "1" });
    fetchItemBookingById.mockResolvedValue({ data: mockItemBooking });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading spinner initially", async () => {
    fetchItemBookingById.mockImplementation(
      () => new Promise(() => {}) // pending
    );

    render(
      <MemoryRouter>
        <EditItemBooking />
      </MemoryRouter>
    );

    expect(screen.getByText(/loading item booking/i)).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("fetches and displays item booking data in the form", async () => {
    renderEditItemBookingPage();

    const heading = await screen.findByRole("heading", {
      name: /Edit Item Booking/i,
    });
    expect(heading).toBeInTheDocument();

    expect(fetchItemBookingById).toHaveBeenCalledWith("1");

    // Check if form fields are populated with booking data
    const itemInput = await screen.findByLabelText("Item");
    expect(itemInput).toHaveValue(mockItemBooking.item_name);
    expect(itemInput).toBeDisabled();

    const eventInput = await screen.findByLabelText("Event");
    expect(eventInput.value).toContain(mockItemBooking.event_name);
    expect(eventInput).toBeDisabled();

    const quantityInput = await screen.findByLabelText("Quantity");
    expect(quantityInput).toHaveValue(mockItemBooking.quantity);
    expect(quantityInput).not.toBeDisabled();
  });

  it("handles form input changes correctly for quantity", async () => {
    renderEditItemBookingPage();

    const quantityInput = await screen.findByLabelText("Quantity");

    // Test input changes
    await user.clear(quantityInput);
    await user.type(quantityInput, "5");

    // Verify input value
    expect(quantityInput.value).toBe("5");
  });

  it("handles successful form submission", async () => {
    // Use a delayed promise to allow testing the disabled state
    let resolveUpdate;
    const updatePromise = new Promise((resolve) => {
      resolveUpdate = resolve;
    });
    updateItemBooking.mockReturnValueOnce(updatePromise);

    renderEditItemBookingPage();

    // Update quantity - await findByLabelText call
    const quantityInput = await screen.findByLabelText("Quantity");

    await user.clear(quantityInput);
    await user.type(quantityInput, "5");

    // Submit the form
    const submitButton = await screen.findByRole("button", {
      name: "Update Booking",
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
      expect(updateItemBooking).toHaveBeenCalledWith(
        "1",
        expect.objectContaining({
          quantity: 5,
        })
      );
      expect(mockNavigate).toHaveBeenCalledWith(
        `/items/${mockItemBooking.item}`
      );
    });
  });

  it("handles form submission error and shows ErrorCard", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    updateItemBooking.mockRejectedValueOnce(new Error("Update failed"));
    renderEditItemBookingPage();

    // Submit the form without changes - wait for button to be available
    const submitButton = await screen.findByRole("button", {
      name: "Update Booking",
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(
          "Failed to update item booking. Please check your input and try again."
        )
      ).toBeInTheDocument();
    });

    const backButton = screen.getByRole("button", { name: /back/i });
    await user.click(backButton);
    // UPDATE_ITEM_BOOKING_FAILED navigates to /items/{id} (back to item details)
    expect(mockNavigate).toHaveBeenCalledWith(`/items/${mockItemBooking.item}`);

    consoleErrorSpy.mockRestore();
  });

  it("shows ErrorCard and allows navigating back when fetching booking data fails", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    fetchItemBookingById.mockRejectedValueOnce(
      new Error("Failed to fetch booking")
    );

    renderEditItemBookingPage();

    // Wait for error to be set and component to render ErrorCard
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error fetching item booking:",
        expect.any(Error)
      );
      // ErrorCard message should be present in the document
      expect(
        screen.getByText(
          "Failed to load item booking details. Please try again later."
        )
      ).toBeInTheDocument();
    });

    // Simulate user clicking the Back button on ErrorCard
    const backButton = screen.getByRole("button", { name: /back/i });
    await user.click(backButton);

    // Should navigate to items list when booking data is not available
    expect(mockNavigate).toHaveBeenCalledWith("/items");
    consoleErrorSpy.mockRestore();
  });

  it("navigates back to item detail page when Cancel is clicked", async () => {
    renderEditItemBookingPage();

    const cancelButton = await screen.findByRole("button", { name: "Cancel" });
    await user.click(cancelButton);

    expect(mockNavigate).toHaveBeenCalledWith(`/items/${mockItemBooking.item}`);
  });

  it("prevents form submission if quantity is less than 1", async () => {
    renderEditItemBookingPage();

    const quantityInput = await screen.findByLabelText("Quantity");
    await user.clear(quantityInput);
    await user.type(quantityInput, "0");

    const submitButton = await screen.findByRole("button", {
      name: "Update Booking",
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(/quantity must be at least 1/i)
      ).toBeInTheDocument();
    });
  });

  it("prevents form submission if quantity is empty", async () => {
    renderEditItemBookingPage();

    const quantityInput = await screen.findByLabelText("Quantity");
    await user.clear(quantityInput);

    const submitButton = await screen.findByRole("button", {
      name: "Update Booking",
    });
    await user.click(submitButton);

    expect(
      await screen.findByText(/quantity must be at least 1/i)
    ).toBeInTheDocument();
  });

  it("handles backend validation error for quantity and displays error message", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const backendError = {
      response: {
        data: {
          quantity: [
            "Cannot book 10 items. Only 5 available for this time period.",
          ],
        },
      },
    };
    updateItemBooking.mockRejectedValueOnce(backendError);
    renderEditItemBookingPage();

    const quantityInput = await screen.findByLabelText("Quantity");
    await user.clear(quantityInput);
    await user.type(quantityInput, "10");
    await user.click(screen.getByRole("button", { name: "Update Booking" }));

    await waitFor(() => {
      expect(
        screen.getByText(
          /Cannot book 10 items. Only 5 available for this time period./i
        )
      ).toBeInTheDocument();
    });

    consoleErrorSpy.mockRestore();
  });

  it("resets previous errors and shows loading state during submission", async () => {
    fetchItemBookingById.mockResolvedValueOnce({ data: mockItemBooking });

    // Use a delayed promise to allow testing the loading state
    let resolveUpdate;
    const updatePromise = new Promise((resolve) => {
      resolveUpdate = resolve;
    });
    updateItemBooking.mockReturnValueOnce(updatePromise);

    render(
      <MemoryRouter>
        <EditItemBooking />
      </MemoryRouter>
    );

    const quantityInput = await screen.findByLabelText("Quantity");
    const submitButton = await screen.findByRole("button", {
      name: "Update Booking",
    });

    // First submit with invalid quantity to cause validation error
    await user.clear(quantityInput);
    await user.click(submitButton);
    expect(
      await screen.findByText(/quantity must be at least 1/i)
    ).toBeInTheDocument();

    // Now fill in valid quantity and resubmit
    await user.type(quantityInput, "5");
    await user.click(submitButton);

    // Should reset errors and show loading state
    await waitFor(() => {
      const updatingButton = screen.getByRole("button", {
        name: /updating booking/i,
      });
      expect(updatingButton).toBeInTheDocument();
    });

    // Resolve the promise to complete the submission
    resolveUpdate({});

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        `/items/${mockItemBooking.item}`
      );
    });
  });

  it("opens delete modal when Delete Booking button is clicked", async () => {
    renderEditItemBookingPage();

    const deleteButton = await screen.findByRole("button", {
      name: "Delete Booking",
    });
    await user.click(deleteButton);

    await waitFor(() => {
      const modal = getVisibleModalByTestId("delete-modal");
      expect(modal).toBeInTheDocument();
      expect(
        screen.getByText(/Are you sure you want to delete the booking for/i)
      ).toBeInTheDocument();
    });
  });

  it("closes delete modal when cancel button is clicked", async () => {
    renderEditItemBookingPage();

    const deleteButton = await screen.findByRole("button", {
      name: "Delete Booking",
    });
    await user.click(deleteButton);

    await waitFor(() => {
      const modal = getVisibleModalByTestId("delete-modal");
      expect(modal).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole("button", { name: /No, cancel/i });
    await user.click(cancelButton);

    await waitFor(() => {
      const modal = getVisibleModalByTestId("delete-modal");
      expect(modal).toBeUndefined();
    });
  });

  it("handles successful deletion and navigates to item detail page", async () => {
    deleteItemBooking.mockResolvedValueOnce({});
    renderEditItemBookingPage();

    const deleteButton = await screen.findByRole("button", {
      name: "Delete Booking",
    });
    await user.click(deleteButton);

    await waitFor(() => {
      const modal = getVisibleModalByTestId("delete-modal");
      expect(modal).toBeInTheDocument();
    });

    const confirmButton = screen.getByRole("button", {
      name: /Yes, I'm sure/i,
    });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(deleteItemBooking).toHaveBeenCalledWith("1");
      expect(mockNavigate).toHaveBeenCalledWith(
        `/items/${mockItemBooking.item}`
      );
    });
  });

  it("handles deletion error and closes modal", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    deleteItemBooking.mockRejectedValueOnce(new Error("Delete failed"));
    renderEditItemBookingPage();

    const deleteButton = await screen.findByRole("button", {
      name: "Delete Booking",
    });
    await user.click(deleteButton);

    await waitFor(() => {
      const modal = getVisibleModalByTestId("delete-modal");
      expect(modal).toBeInTheDocument();
    });

    const confirmButton = screen.getByRole("button", {
      name: /Yes, I'm sure/i,
    });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error deleting item booking:",
        expect.any(Error)
      );
      expect(
        screen.getByText(
          "Failed to delete item booking. Please try again later."
        )
      ).toBeInTheDocument();
      // Modal should be closed
      const modal = getVisibleModalByTestId("delete-modal");
      expect(modal).toBeUndefined();
    });

    consoleErrorSpy.mockRestore();
  });

  it("disables all buttons during form submission", async () => {
    let resolveUpdate;
    const updatePromise = new Promise((resolve) => {
      resolveUpdate = resolve;
    });
    updateItemBooking.mockReturnValueOnce(updatePromise);

    renderEditItemBookingPage();

    const submitButton = await screen.findByRole("button", {
      name: "Update Booking",
    });
    const deleteButton = await screen.findByRole("button", {
      name: "Delete Booking",
    });
    const cancelButton = await screen.findByRole("button", {
      name: "Cancel",
    });

    await user.click(submitButton);

    await waitFor(() => {
      expect(submitButton).toBeDisabled();
      expect(deleteButton).toBeDisabled();
      expect(cancelButton).toBeDisabled();
    });

    resolveUpdate({});
  });

  it("displays formatted event information in disabled event field", async () => {
    renderEditItemBookingPage();

    const eventInput = await screen.findByLabelText("Event");

    // Check that the event field contains the event name and formatted dates
    expect(eventInput.value).toContain(mockItemBooking.event_name);
    expect(eventInput.value).toContain("7/15/2024"); // Formatted date
    expect(eventInput).toBeDisabled();
  });
});
