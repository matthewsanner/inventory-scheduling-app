import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useNavigate, useParams } from "react-router";
import NewItemBooking from "../pages/NewItemBooking";
import { mockCurrentFutureEvents, mockItemBookingFormData } from "./testUtils";
import {
  getCurrentFutureEvents,
  createItemBooking,
} from "../services/NewItemBookingService";

// Mock service module
vi.mock("../services/NewItemBookingService", () => ({
  getCurrentFutureEvents: vi.fn(),
  createItemBooking: vi.fn(),
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

const renderNewItemBookingPage = () => {
  render(
    <MemoryRouter>
      <NewItemBooking />
    </MemoryRouter>
  );
};

describe("NewItemBooking Page", () => {
  beforeEach(() => {
    useNavigate.mockReturnValue(mockNavigate);
    useParams.mockReturnValue({ id: "1" });
    getCurrentFutureEvents.mockResolvedValue({ data: mockCurrentFutureEvents });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading state while fetching events", async () => {
    getCurrentFutureEvents.mockImplementation(() => new Promise(() => {}));
    render(
      <MemoryRouter>
        <NewItemBooking />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/loading events/i)).toBeInTheDocument();
    });
  });

  it("renders the form with all required fields", async () => {
    renderNewItemBookingPage();

    await waitFor(() => {
      expect(screen.getByText("Book Item")).toBeInTheDocument();
      expect(screen.getByLabelText("Event")).toBeInTheDocument();
      expect(screen.getByLabelText("Quantity")).toBeInTheDocument();
    });
  });

  it("fetches and displays event options in the select dropdown", async () => {
    renderNewItemBookingPage();

    await waitFor(() => {
      expect(screen.getByLabelText("Event")).toBeInTheDocument();
      expect(screen.getByText("Select an event")).toBeInTheDocument();
    });

    expect(getCurrentFutureEvents).toHaveBeenCalledTimes(1);
  });

  it("displays event names with formatted dates in dropdown", async () => {
    renderNewItemBookingPage();

    await waitFor(() => {
      // Check that events are displayed with formatted dates
      const eventSelect = screen.getByLabelText("Event");
      expect(eventSelect).toBeInTheDocument();
    });
  });

  it("handles form input changes correctly", async () => {
    renderNewItemBookingPage();

    await waitFor(() => {
      expect(screen.getByLabelText("Event")).toBeInTheDocument();
      expect(screen.getByLabelText("Quantity")).toBeInTheDocument();
    });

    const eventSelect = screen.getByLabelText("Event");
    const quantityInput = screen.getByLabelText("Quantity");

    await user.selectOptions(eventSelect, mockItemBookingFormData.event);
    // Clear and type new value - need to select all first to ensure it's cleared
    await user.clear(quantityInput);
    await user.type(quantityInput, mockItemBookingFormData.quantity.toString());

    await waitFor(() => {
      expect(eventSelect.value).toBe(mockItemBookingFormData.event);
      expect(quantityInput.value).toBe(
        mockItemBookingFormData.quantity.toString()
      );
    });
  });

  it("submits the form successfully and navigates to item detail page", async () => {
    createItemBooking.mockResolvedValueOnce({});
    renderNewItemBookingPage();

    await waitFor(() => {
      expect(screen.getByLabelText("Event")).toBeInTheDocument();
      expect(screen.getByLabelText("Quantity")).toBeInTheDocument();
    });

    await user.selectOptions(
      screen.getByLabelText("Event"),
      mockItemBookingFormData.event
    );
    const quantityInput = screen.getByLabelText("Quantity");
    // Select all and replace to ensure we get the exact value
    await user.click(quantityInput);
    await user.clear(quantityInput);
    await user.type(quantityInput, mockItemBookingFormData.quantity.toString());

    const submitButton = screen.getByRole("button", {
      name: "Add Item Booking",
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(createItemBooking).toHaveBeenCalledWith(
        expect.objectContaining({
          item: "1",
          event: mockItemBookingFormData.event,
          quantity: mockItemBookingFormData.quantity,
        })
      );
    });

    expect(mockNavigate).toHaveBeenCalledWith("/items/1");
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
    createItemBooking.mockRejectedValueOnce(backendError);
    renderNewItemBookingPage();

    await waitFor(() => {
      expect(screen.getByLabelText("Event")).toBeInTheDocument();
    });

    await user.selectOptions(
      screen.getByLabelText("Event"),
      mockItemBookingFormData.event
    );
    const quantityInput = screen.getByLabelText("Quantity");
    await user.clear(quantityInput);
    await user.type(quantityInput, "10");
    await user.click(screen.getByRole("button", { name: "Add Item Booking" }));

    await waitFor(() => {
      expect(
        screen.getByText(
          /Cannot book 10 items. Only 5 available for this time period./i
        )
      ).toBeInTheDocument();
    });

    consoleErrorSpy.mockRestore();
  });

  it("handles form submission error and shows ErrorCard", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    createItemBooking.mockRejectedValueOnce(new Error("API error"));
    renderNewItemBookingPage();

    await waitFor(() => {
      expect(screen.getByLabelText("Event")).toBeInTheDocument();
    });

    await user.selectOptions(
      screen.getByLabelText("Event"),
      mockItemBookingFormData.event
    );
    await user.click(screen.getByRole("button", { name: "Add Item Booking" }));

    await waitFor(() => {
      expect(
        screen.getByText(
          "Failed to create item booking. Please try again later."
        )
      ).toBeInTheDocument();
    });

    const backButton = screen.getByRole("button", {
      name: "← Back to Item Details",
    });
    await user.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith("/items/1");

    consoleErrorSpy.mockRestore();
  });

  it("navigates back to item detail page when Cancel is clicked", async () => {
    renderNewItemBookingPage();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Cancel" })
      ).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole("button", { name: "Cancel" });
    await user.click(cancelButton);

    expect(mockNavigate).toHaveBeenCalledWith("/items/1");
  });

  it("renders fallback text when fetching events fails", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    getCurrentFutureEvents.mockRejectedValueOnce(new Error("Network error"));

    render(
      <MemoryRouter>
        <NewItemBooking />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByLabelText("Event")).toBeInTheDocument();
      expect(screen.getByText("Events unavailable")).toBeInTheDocument();
    });

    consoleErrorSpy.mockRestore();
  });

  it("prevents form submission if required fields are empty", async () => {
    renderNewItemBookingPage();

    await waitFor(() => {
      expect(screen.getByLabelText("Quantity")).toBeInTheDocument();
    });

    const quantityInput = screen.getByLabelText("Quantity");
    await user.clear(quantityInput);

    const submitButton = screen.getByRole("button", {
      name: "Add Item Booking",
    });
    await user.click(submitButton);

    expect(await screen.findByText(/event is required/i)).toBeInTheDocument();
    expect(
      await screen.findByText(/quantity must be at least 1/i)
    ).toBeInTheDocument();
  });

  it("prevents form submission if quantity is less than 1", async () => {
    renderNewItemBookingPage();

    await waitFor(() => {
      expect(screen.getByLabelText("Quantity")).toBeInTheDocument();
    });

    const quantityInput = screen.getByLabelText("Quantity");
    await user.clear(quantityInput);
    await user.type(quantityInput, "0");

    const submitButton = screen.getByRole("button", {
      name: "Add Item Booking",
    });
    await user.click(submitButton);

    expect(
      await screen.findByText(/quantity must be at least 1/i)
    ).toBeInTheDocument();
  });

  it("shows loading state during submission", async () => {
    let resolveCreate;
    const createPromise = new Promise((resolve) => {
      resolveCreate = resolve;
    });
    createItemBooking.mockReturnValueOnce(createPromise);

    renderNewItemBookingPage();

    await waitFor(() => {
      expect(screen.getByLabelText("Event")).toBeInTheDocument();
    });

    await user.selectOptions(
      screen.getByLabelText("Event"),
      mockItemBookingFormData.event
    );
    const submitButton = screen.getByRole("button", {
      name: "Add Item Booking",
    });
    await user.click(submitButton);

    await waitFor(() => {
      const updatedButton = screen.getByRole("button", {
        name: /booking item/i,
      });
      expect(updatedButton).toHaveTextContent(/booking item/i);
    });

    resolveCreate({});

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/items/1");
    });
  });
});
