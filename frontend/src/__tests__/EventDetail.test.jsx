import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useNavigate, useParams } from "react-router";
import EventDetail from "../pages/EventDetail";
import { mockEvent, mockItemBookings } from "./testUtils";
import { getEvent, deleteEvent } from "../services/EventDetailService";
import { getItemBookingsByEvent } from "../services/ItemBookingService";

// Mock service modules
vi.mock("../services/EventDetailService", () => ({
  getEvent: vi.fn(),
  deleteEvent: vi.fn(),
}));

vi.mock("../services/ItemBookingService", () => ({
  getItemBookingsByEvent: vi.fn(),
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

const renderEventDetailPage = () =>
  render(
    <MemoryRouter>
      <EventDetail />
    </MemoryRouter>
  );

describe("EventDetail Page", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    useNavigate.mockReturnValue(mockNavigate);
    useParams.mockReturnValue({ id: "1" });
    getEvent.mockResolvedValue({ data: mockEvent });
    // Mock bookings for event (filtered by event, showing item_name and quantity)
    const eventBookings = mockItemBookings.map((booking) => ({
      ...booking,
      // For event detail page, we show item_name and quantity
    }));
    getItemBookingsByEvent.mockResolvedValue({ data: eventBookings });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading spinner when loading is true", async () => {
    getEvent.mockImplementation(() => new Promise(() => {}));
    renderEventDetailPage();

    await waitFor(() => {
      // Expect spinner and loading text to show up
      expect(screen.getByText(/loading event/i)).toBeInTheDocument();
      // Flowbite spinner component uses role="status" for accessibility
      expect(screen.getByRole("status")).toBeInTheDocument();
    });
  });

  it("fetches and displays event details", async () => {
    renderEventDetailPage();

    await waitFor(() => {
      // Check event name as header
      expect(screen.getByText("Summer Festival")).toBeInTheDocument();

      // Check all event details are displayed
      expect(screen.getByText(/start date & time/i)).toBeInTheDocument();
      expect(screen.getByText(/end date & time/i)).toBeInTheDocument();
      expect(screen.getByText("Central Park")).toBeInTheDocument();
      expect(
        screen.getByText("Annual summer music festival")
      ).toBeInTheDocument();
    });

    // Verify API call
    expect(getEvent).toHaveBeenCalledWith("1");
  });

  it("displays formatted datetime correctly", async () => {
    renderEventDetailPage();

    await waitFor(() => {
      // Check that dates are formatted (should contain month abbreviation and time)
      const startDateText =
        screen.getByText(/start date & time/i).parentElement.textContent;
      expect(startDateText).toMatch(/Jul|July/);
      expect(startDateText).toMatch(/\d{1,2}/);
    });
  });

  it("displays location when available", async () => {
    renderEventDetailPage();

    await waitFor(() => {
      expect(screen.getByText("Central Park")).toBeInTheDocument();
    });
  });

  it('displays "No location specified" when location is empty', async () => {
    const eventWithoutLocation = { ...mockEvent, location: "" };
    getEvent.mockResolvedValueOnce({ data: eventWithoutLocation });

    renderEventDetailPage();

    await waitFor(() => {
      expect(screen.getByText("No location specified.")).toBeInTheDocument();
    });
  });

  it("displays notes when available", async () => {
    renderEventDetailPage();

    await waitFor(() => {
      expect(
        screen.getByText("Annual summer music festival")
      ).toBeInTheDocument();
    });
  });

  it("does not display notes section when notes are empty", async () => {
    const eventWithoutNotes = { ...mockEvent, notes: "" };
    getEvent.mockResolvedValueOnce({ data: eventWithoutNotes });

    renderEventDetailPage();

    await waitFor(() => {
      expect(screen.getByText("Summer Festival")).toBeInTheDocument();
      // Notes section should not be visible
      expect(screen.queryByText(/notes/i)).not.toBeInTheDocument();
    });
  });

  it("handles API error when fetching event", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    getEvent.mockRejectedValueOnce(new Error("Failed to fetch"));

    renderEventDetailPage();

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error fetching event:",
        expect.any(Error)
      );
      // Also check that the error message appears in the UI
      expect(
        screen.getByText(
          "Failed to load event details. Please try again later."
        )
      ).toBeInTheDocument();
    });

    consoleErrorSpy.mockRestore();
  });

  it("navigates back to events page when Back button is clicked", async () => {
    renderEventDetailPage();

    await waitFor(() => {
      expect(screen.getByText("Summer Festival")).toBeInTheDocument();
    });

    const backButton = screen.getByRole("button", { name: "← Back to Events" });
    await user.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith("/events");
  });

  it("navigates to edit page when Edit Event button is clicked", async () => {
    renderEventDetailPage();

    await waitFor(() => {
      expect(screen.getByText("Summer Festival")).toBeInTheDocument();
    });

    const editButton = screen.getByRole("button", { name: "Edit Event" });
    await user.click(editButton);

    expect(mockNavigate).toHaveBeenCalledWith("/events/1/edit");
  });

  it("opens delete confirmation modal when Delete Event button is clicked", async () => {
    renderEventDetailPage();

    // Wait for the initial content to appear
    await waitFor(() => {
      expect(screen.getByText("Summer Festival")).toBeInTheDocument();
    });

    // Click the delete button
    const deleteButton = screen.getByRole("button", { name: "Delete Event" });
    await user.click(deleteButton);

    // Get the modal by its test ID
    const modal = await waitFor(() => getVisibleModalByTestId("delete-modal"));

    // Scope queries to inside the modal
    const { getByText, getByRole } = within(modal);

    expect(getByText(/Are you sure you want to delete/)).toBeInTheDocument();
    expect(getByText(/Summer Festival/)).toBeInTheDocument();
    expect(getByRole("button", { name: "Yes, I'm sure" })).toBeInTheDocument();
    expect(getByRole("button", { name: "No, cancel" })).toBeInTheDocument();
  });

  it("closes delete modal when cancel is clicked", async () => {
    renderEventDetailPage();

    await waitFor(() => {
      expect(screen.getByText("Summer Festival")).toBeInTheDocument();
    });

    // Open modal
    await user.click(screen.getByRole("button", { name: "Delete Event" }));
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

  it("deletes event and navigates to events page when confirmed", async () => {
    deleteEvent.mockResolvedValueOnce({});
    renderEventDetailPage();

    await waitFor(() => {
      expect(screen.getByText("Summer Festival")).toBeInTheDocument();
    });

    // Open modal and confirm deletion
    await user.click(screen.getByRole("button", { name: "Delete Event" }));
    await user.click(screen.getByRole("button", { name: "Yes, I'm sure" }));

    await waitFor(() => {
      expect(deleteEvent).toHaveBeenCalledWith("1");
      expect(mockNavigate).toHaveBeenCalledWith("/events");
    });
  });

  it("handles delete API error", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    deleteEvent.mockRejectedValueOnce(new Error("Failed to delete"));

    renderEventDetailPage();

    await waitFor(() => {
      expect(screen.getByText("Summer Festival")).toBeInTheDocument();
    });

    // Open modal and confirm deletion
    await user.click(screen.getByRole("button", { name: "Delete Event" }));
    await user.click(screen.getByRole("button", { name: "Yes, I'm sure" }));

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error deleting event:",
        expect.any(Error)
      );
      expect(
        screen.getByText("Failed to delete event. Please try again later.")
      ).toBeInTheDocument();
    });

    consoleErrorSpy.mockRestore();
  });

  it("fetches and displays item bookings", async () => {
    renderEventDetailPage();

    await waitFor(() => {
      expect(screen.getByText("Item Bookings")).toBeInTheDocument();
      // Check that Fancy Dress appears (may appear multiple times in bookings)
      const fancyDressElements = screen.getAllByText("Fancy Dress");
      expect(fancyDressElements.length).toBeGreaterThan(0);
      // Check quantities appear in the bookings table
      expect(screen.getByText("2")).toBeInTheDocument();
      expect(screen.getByText("1")).toBeInTheDocument();
    });

    expect(getItemBookingsByEvent).toHaveBeenCalledWith("1");
  });

  it("displays loading state for bookings", async () => {
    getItemBookingsByEvent.mockImplementation(() => new Promise(() => {}));
    renderEventDetailPage();

    await waitFor(() => {
      expect(screen.getByText("Summer Festival")).toBeInTheDocument();
      expect(screen.getByText(/loading bookings/i)).toBeInTheDocument();
    });
  });

  it("displays message when no bookings exist", async () => {
    getItemBookingsByEvent.mockResolvedValueOnce({ data: [] });
    renderEventDetailPage();

    await waitFor(() => {
      expect(screen.getByText("Summer Festival")).toBeInTheDocument();
      expect(
        screen.getByText("No bookings for this event.")
      ).toBeInTheDocument();
    });
  });

  it("navigates to booking edit page when booking row is clicked", async () => {
    renderEventDetailPage();

    await waitFor(() => {
      expect(screen.getByText("Item Bookings")).toBeInTheDocument();
      // Wait for bookings to load
      expect(screen.getAllByText("Fancy Dress").length).toBeGreaterThan(0);
    });

    // Find the bookings table and then find the first row within it
    const itemBookingsHeading = screen.getByText("Item Bookings");
    const bookingsCard =
      itemBookingsHeading.closest('[class*="Card"]') ||
      itemBookingsHeading.closest("div");
    const table = bookingsCard?.querySelector("table");
    expect(table).toBeInTheDocument();

    // Find the first row in the table body
    const firstRow = table.querySelector("tbody tr");
    expect(firstRow).toBeInTheDocument();
    await user.click(firstRow);

    expect(mockNavigate).toHaveBeenCalledWith("/itembookings/1/edit");
  });

  it("handles booking fetch error gracefully", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    getItemBookingsByEvent.mockRejectedValueOnce(new Error("Failed to fetch"));

    renderEventDetailPage();

    await waitFor(() => {
      expect(screen.getByText("Summer Festival")).toBeInTheDocument();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error fetching bookings:",
        expect.any(Error)
      );
      // Should still show the event details even if bookings fail
      expect(screen.getByText("Summer Festival")).toBeInTheDocument();
    });

    consoleErrorSpy.mockRestore();
  });
});
