import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useNavigate } from "react-router";
import Events from "../pages/Events";
import { mockEvents } from "./testUtils";
import { getEvents } from "../services/EventsService";

// Mock service module
vi.mock("../services/EventsService", () => ({
  getEvents: vi.fn(),
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

const renderEventsPage = () =>
  render(
    <MemoryRouter>
      <Events />
    </MemoryRouter>
  );

describe("Events Page", () => {
  const user = userEvent.setup();

  beforeEach(() => {
    getEvents.mockResolvedValue({ data: mockEvents.results, pageCount: 1 });
    useNavigate.mockReturnValue(mockNavigate);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("fetches and displays events in the table", async () => {
    renderEventsPage();
    await waitFor(() => {
      const table = screen.getByTestId("events-table");
      expect(within(table).getByText("Summer Festival")).toBeInTheDocument();
      expect(within(table).getByText("Winter Gala")).toBeInTheDocument();
      expect(within(table).getByText("Central Park")).toBeInTheDocument();
      expect(within(table).getByText("Grand Ballroom")).toBeInTheDocument();
    });
  });

  it("formats and displays datetime correctly", async () => {
    renderEventsPage();
    await waitFor(() => {
      const table = screen.getByTestId("events-table");
      // Check that dates are formatted (should contain month abbreviations)
      const dateCells = within(table).getAllByText(/Jul|Dec/i);
      expect(dateCells.length).toBeGreaterThan(0);
    });
  });

  it("displays '—' for events with no location", async () => {
    const eventsWithoutLocation = {
      count: 1,
      results: [
        {
          id: 3,
          name: "Virtual Event",
          start_datetime: "2024-08-01T12:00:00Z",
          end_datetime: "2024-08-01T14:00:00Z",
          location: "",
          notes: "Online event",
        },
      ],
    };
    getEvents.mockResolvedValueOnce({
      data: eventsWithoutLocation.results,
      pageCount: 1,
    });
    renderEventsPage();
    await waitFor(() => {
      expect(screen.getByText("Virtual Event")).toBeInTheDocument();
      expect(screen.getByText("—")).toBeInTheDocument();
    });
  });

  it("displays 'No events available' message when there are no events", async () => {
    getEvents.mockResolvedValueOnce({ data: [], pageCount: 0 });
    renderEventsPage();
    await waitFor(() => {
      expect(screen.getByText("No events available")).toBeInTheDocument();
    });
  });

  it("applies the search filter and updates the table", async () => {
    // Initial load with all events
    getEvents.mockResolvedValueOnce({ data: mockEvents.results, pageCount: 1 });

    renderEventsPage();

    await waitFor(() => {
      expect(screen.getByText("Winter Gala")).toBeInTheDocument();
    });

    // Mock filtered results for all calls after search is applied
    getEvents.mockResolvedValue({
      data: [mockEvents.results[0]],
      pageCount: 1,
    });

    const searchInput = screen.getByPlaceholderText("Search events...");
    await user.type(searchInput, "Summer");

    await waitFor(() => {
      const table = screen.getByTestId("events-table");
      expect(within(table).getByText("Summer Festival")).toBeInTheDocument();
      // Ensure non-matching event is removed from the table
      expect(screen.queryByText("Winter Gala")).not.toBeInTheDocument();
    });
  });

  it("applies location filter and updates the table", async () => {
    // Initial load with all events
    getEvents.mockResolvedValueOnce({ data: mockEvents.results, pageCount: 1 });

    renderEventsPage();

    // Wait for initial events
    await waitFor(() => {
      expect(screen.getByText("Winter Gala")).toBeInTheDocument();
    });

    // Mock filtered results when location is entered
    getEvents.mockResolvedValue({
      data: [mockEvents.results[0]],
      pageCount: 1,
    });

    const locationInput = screen.getByPlaceholderText("Filter by location...");
    await user.type(locationInput, "Central");

    await waitFor(() => {
      const table = screen.getByTestId("events-table");
      expect(within(table).getByText("Summer Festival")).toBeInTheDocument();
      // Ensure non-matching event is not in the table
      expect(screen.queryByText("Winter Gala")).not.toBeInTheDocument();
    });
  });

  it("fetches and displays next page of events when Next button or page number is clicked", async () => {
    const page1Events = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      name: `Event ${i + 1}`,
      start_datetime: "2024-07-15T10:00:00Z",
      end_datetime: "2024-07-15T18:00:00Z",
      location: "Location A",
      notes: "Event notes",
    }));

    const page2Events = Array.from({ length: 10 }, (_, i) => ({
      id: i + 11,
      name: `Event ${i + 11}`,
      start_datetime: "2024-08-15T10:00:00Z",
      end_datetime: "2024-08-15T18:00:00Z",
      location: "Location B",
      notes: "Event notes",
    }));

    // Initial load with page 1 events
    getEvents.mockResolvedValueOnce({ data: page1Events, pageCount: 2 });

    renderEventsPage();

    // Wait for page 1 events
    await waitFor(() => {
      expect(screen.getByText("Event 1")).toBeInTheDocument();
      expect(screen.getByText("Event 10")).toBeInTheDocument();
    });

    // Mock page 2 events
    getEvents.mockResolvedValueOnce({ data: page2Events, pageCount: 2 });

    // Click Next button in pagination
    const nextButton = screen.getByRole("button", { name: /next/i });
    await user.click(nextButton);

    // Wait for page 2 events
    await waitFor(() => {
      expect(screen.getByText("Event 11")).toBeInTheDocument();
      expect(screen.getByText("Event 20")).toBeInTheDocument();
    });

    // Assert page 1 events are gone
    expect(screen.queryByText("Event 1")).not.toBeInTheDocument();

    // Mock page 1 events again
    getEvents.mockResolvedValueOnce({ data: page1Events, pageCount: 2 });

    // Click on page number 1 button
    const page1Button = screen.getByRole("button", { name: "1" });
    await user.click(page1Button);

    // Wait for page 1 events to render
    await waitFor(() => {
      expect(screen.getByText("Event 1")).toBeInTheDocument();
      expect(screen.getByText("Event 7")).toBeInTheDocument();
    });

    // Confirm page 2 events are gone
    expect(screen.queryByText("Event 14")).not.toBeInTheDocument();
  });

  it("renders loading spinner when loading is true", async () => {
    // Mock getEvents to return unresolved promise so loading stays true
    getEvents.mockImplementation(() => new Promise(() => {}));

    renderEventsPage();

    await waitFor(() => {
      // Expect spinner and loading text to show up
      expect(screen.getByText(/loading events/i)).toBeInTheDocument();
      // Flowbite spinner component uses role="status" for accessibility
      expect(screen.getByRole("status")).toBeInTheDocument();
    });
  });

  it("navigates to event detail page when a table row is clicked", async () => {
    renderEventsPage();

    // Wait for the table to render events
    await waitFor(() => {
      expect(screen.getByText("Summer Festival")).toBeInTheDocument();
      expect(screen.getByText("Winter Gala")).toBeInTheDocument();
    });

    // Click the row for event with id 1
    await user.click(screen.getByTestId("event-row-1"));
    expect(mockNavigate).toHaveBeenCalledWith("/events/1");

    // Click the row for event with id 2
    await user.click(screen.getByTestId("event-row-2"));
    expect(mockNavigate).toHaveBeenCalledWith("/events/2");
  });

  it("displays error message when API call fails", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    getEvents.mockResolvedValueOnce({
      errorKey: "LOAD_EVENTS_FAILED",
      error: new Error("Network Error"),
    });

    renderEventsPage();

    await waitFor(() => {
      expect(screen.getByText(/failed to load events/i)).toBeInTheDocument();
    });

    consoleErrorSpy.mockRestore();
  });

  it("clears search input via clear button and resets event table", async () => {
    // Initial load with all events
    getEvents.mockResolvedValueOnce({ data: mockEvents.results, pageCount: 1 });

    renderEventsPage();

    // Wait for initial unfiltered data (Winter Gala present)
    await waitFor(() => {
      expect(screen.getByText("Winter Gala")).toBeInTheDocument();
    });

    // Mock filtered results when search is applied
    getEvents.mockResolvedValueOnce({
      data: [mockEvents.results[0]],
      pageCount: 1,
    });

    const searchInput = screen.getByPlaceholderText("Search events...");
    await user.type(searchInput, "Summer");

    // Wait for filtered result (Summer Festival only)
    await waitFor(() => {
      expect(screen.getByText("Summer Festival")).toBeInTheDocument();
    });

    // Mock unfiltered results when clear is clicked
    getEvents.mockResolvedValueOnce({ data: mockEvents.results, pageCount: 1 });

    // Find and click the Clear button
    const clearButton = screen.getByRole("button", { name: /clear filters/i });
    await user.click(clearButton);

    // Wait for table to reset to original unfiltered data
    await waitFor(() => {
      expect(screen.getByText("Winter Gala")).toBeInTheDocument();
      expect(screen.getByText("Summer Festival")).toBeInTheDocument();
    });
  });

  it("disables pagination buttons appropriately", async () => {
    const page1Events = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      name: `Event ${i + 1}`,
      start_datetime: "2024-07-15T10:00:00Z",
      end_datetime: "2024-07-15T18:00:00Z",
      location: "Location A",
      notes: "Event notes",
    }));

    const page2Events = Array.from({ length: 10 }, (_, i) => ({
      id: i + 11,
      name: `Event ${i + 11}`,
      start_datetime: "2024-08-15T10:00:00Z",
      end_datetime: "2024-08-15T18:00:00Z",
      location: "Location B",
      notes: "Event notes",
    }));

    // Initial load with page 1 events
    getEvents.mockResolvedValueOnce({ data: page1Events, pageCount: 2 });

    renderEventsPage();

    await waitFor(() => {
      expect(screen.getByText("Event 1")).toBeInTheDocument();
    });

    const prevButton = screen.getByRole("button", { name: /previous/i });
    const nextButton = screen.getByRole("button", { name: /next/i });

    // On first page: previous disabled, next enabled
    expect(prevButton).toBeDisabled();
    expect(nextButton).toBeEnabled();

    // Mock page 2 events
    getEvents.mockResolvedValueOnce({ data: page2Events, pageCount: 2 });

    await user.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText("Event 11")).toBeInTheDocument();
    });

    // On second (last) page: next disabled, previous enabled
    expect(prevButton).toBeEnabled();
    expect(nextButton).toBeDisabled();
  });
});

