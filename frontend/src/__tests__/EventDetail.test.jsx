import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useNavigate, useParams } from "react-router";
import EventDetail from "../pages/EventDetail";
import { mockEvent } from "./testUtils";
import { getEvent } from "../services/EventDetailService";

// Mock service module
vi.mock("../services/EventDetailService", () => ({
  getEvent: vi.fn(),
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
      expect(screen.getByText("Annual summer music festival")).toBeInTheDocument();
    });

    // Verify API call
    expect(getEvent).toHaveBeenCalledWith("1");
  });

  it("displays formatted datetime correctly", async () => {
    renderEventDetailPage();

    await waitFor(() => {
      // Check that dates are formatted (should contain month abbreviation and time)
      const startDateText = screen.getByText(/start date & time/i).parentElement.textContent;
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
      expect(screen.getByText("Annual summer music festival")).toBeInTheDocument();
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
        screen.getByText("Failed to load event details. Please try again later.")
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

  it("displays Delete Event button", async () => {
    const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    renderEventDetailPage();

    await waitFor(() => {
      expect(screen.getByText("Summer Festival")).toBeInTheDocument();
    });

    const deleteButton = screen.getByRole("button", { name: "Delete Event" });
    expect(deleteButton).toBeInTheDocument();
    
    await user.click(deleteButton);
    expect(consoleLogSpy).toHaveBeenCalledWith("Delete event functionality to be implemented");
    
    consoleLogSpy.mockRestore();
  });
});

