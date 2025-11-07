import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useNavigate, useParams } from "react-router";
import EditEvent from "../pages/EditEvent";
import { mockEvent } from "./testUtils";
import { fetchEventById, updateEvent } from "../services/EditEventService";

// Mock service module
vi.mock("../services/EditEventService", () => ({
  fetchEventById: vi.fn(),
  updateEvent: vi.fn(),
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

const renderEditEventPage = async () => {
  render(
    <MemoryRouter>
      <EditEvent />
    </MemoryRouter>
  );
};

describe("EditEvent Page", () => {
  beforeEach(() => {
    useNavigate.mockReturnValue(mockNavigate);
    useParams.mockReturnValue({ id: "1" });
    fetchEventById.mockResolvedValue({ data: mockEvent });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading spinner initially", async () => {
    fetchEventById.mockImplementation(
      () => new Promise(() => {}) // pending
    );

    render(
      <MemoryRouter>
        <EditEvent />
      </MemoryRouter>
    );

    expect(screen.getByText(/loading event/i)).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("fetches and displays event data in the form", async () => {
    renderEditEventPage();

    const heading = await screen.findByRole("heading", { name: /Edit Event/i });
    expect(heading).toBeInTheDocument();

    expect(fetchEventById).toHaveBeenCalledWith("1");

    // Check if form fields are populated with event data
    const nameInput = await screen.findByLabelText("Name");
    expect(nameInput).toHaveValue(mockEvent.name);
    const startDatetimeInput = await screen.findByLabelText("Start Date & Time");
    // The datetime-local input should have the converted format
    expect(startDatetimeInput).toHaveValue("2024-07-15T10:00");
    const endDatetimeInput = await screen.findByLabelText("End Date & Time");
    expect(endDatetimeInput).toHaveValue("2024-07-15T18:00");
    const locationInput = await screen.findByLabelText("Location");
    expect(locationInput).toHaveValue(mockEvent.location);
    const notesInput = await screen.findByLabelText("Notes");
    expect(notesInput).toHaveValue(mockEvent.notes);
  });

  it("handles form input changes correctly", async () => {
    renderEditEventPage();

    // Get form inputs - await all findByLabelText calls
    const nameInput = await screen.findByLabelText("Name");
    const startDatetimeInput = await screen.findByLabelText("Start Date & Time");
    const endDatetimeInput = await screen.findByLabelText("End Date & Time");
    const locationInput = await screen.findByLabelText("Location");
    const notesInput = await screen.findByLabelText("Notes");

    // Test input changes
    await user.clear(nameInput);
    await user.type(nameInput, "Updated Event Name");
    await user.clear(startDatetimeInput);
    await user.type(startDatetimeInput, "2024-08-15T14:00");
    await user.clear(endDatetimeInput);
    await user.type(endDatetimeInput, "2024-08-15T20:00");
    await user.clear(locationInput);
    await user.type(locationInput, "New Location");
    await user.clear(notesInput);
    await user.type(notesInput, "Updated notes");

    // Verify input values
    expect(nameInput.value).toBe("Updated Event Name");
    expect(startDatetimeInput.value).toBe("2024-08-15T14:00");
    expect(endDatetimeInput.value).toBe("2024-08-15T20:00");
    expect(locationInput.value).toBe("New Location");
    expect(notesInput.value).toBe("Updated notes");
  });

  it("handles successful form submission", async () => {
    // Use a delayed promise to allow testing the disabled state
    let resolveUpdate;
    const updatePromise = new Promise((resolve) => {
      resolveUpdate = resolve;
    });
    updateEvent.mockReturnValueOnce(updatePromise);

    renderEditEventPage();

    // Update some fields - await all findByLabelText calls
    const nameInput = await screen.findByLabelText("Name");
    const startDatetimeInput = await screen.findByLabelText("Start Date & Time");
    const endDatetimeInput = await screen.findByLabelText("End Date & Time");

    await user.clear(nameInput);
    await user.type(nameInput, "Updated Event Name");
    await user.clear(startDatetimeInput);
    await user.type(startDatetimeInput, "2024-08-15T14:00");
    await user.clear(endDatetimeInput);
    await user.type(endDatetimeInput, "2024-08-15T20:00");

    // Submit the form
    const submitButton = await screen.findByRole("button", {
      name: "Update Event",
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
      expect(updateEvent).toHaveBeenCalledWith(
        "1",
        expect.objectContaining({
          name: "Updated Event Name",
          start_datetime: expect.stringContaining("2024-08-15T14:00"),
          end_datetime: expect.stringContaining("2024-08-15T20:00"),
        })
      );
      expect(mockNavigate).toHaveBeenCalledWith("/events");
    });
  });

  it("handles form submission error and shows ErrorCard", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    updateEvent.mockRejectedValueOnce(new Error("Update failed"));
    renderEditEventPage();

    // Submit the form without changes - wait for button to be available
    const submitButton = await screen.findByRole("button", {
      name: "Update Event",
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText(
          "Failed to update event. Please check your input and try again."
        )
      ).toBeInTheDocument();
    });

    const backButton = screen.getByRole("button", { name: /back/i });
    await user.click(backButton);
    // UPDATE_EVENT_FAILED navigates to /events/{id} (back to event details)
    expect(mockNavigate).toHaveBeenCalledWith("/events/1");

    consoleErrorSpy.mockRestore();
  });

  it("shows ErrorCard and allows navigating back when fetching event data fails", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    fetchEventById.mockRejectedValueOnce(new Error("Failed to fetch event"));

    renderEditEventPage();

    // Wait for error to be set and component to render ErrorCard
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error fetching event:",
        expect.any(Error)
      );
      // ErrorCard message should be present in the document
      expect(
        screen.getByText("Failed to load event details. Please try again later.")
      ).toBeInTheDocument();
    });

    // Simulate user clicking the Back button on ErrorCard
    const backButton = screen.getByRole("button", { name: /back/i });
    await user.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith("/events");
    consoleErrorSpy.mockRestore();
  });

  it("navigates back to events page when Cancel is clicked", async () => {
    renderEditEventPage();

    const cancelButton = await screen.findByRole("button", { name: "Cancel" });
    await user.click(cancelButton);

    expect(mockNavigate).toHaveBeenCalledWith("/events");
  });

  it("prevents form submission if required fields are empty", async () => {
    renderEditEventPage();

    const nameInput = await screen.findByLabelText("Name");
    await user.clear(nameInput);

    const startDatetimeInput = await screen.findByLabelText("Start Date & Time");
    await user.clear(startDatetimeInput);

    const endDatetimeInput = await screen.findByLabelText("End Date & Time");
    await user.clear(endDatetimeInput);

    const submitButton = await screen.findByRole("button", {
      name: "Update Event",
    });
    await user.click(submitButton);

    expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
    expect(
      await screen.findByText(/start date and time is required/i)
    ).toBeInTheDocument();
    expect(
      await screen.findByText(/end date and time is required/i)
    ).toBeInTheDocument();
  });

  it("validates that end datetime is after start datetime", async () => {
    renderEditEventPage();

    const startDatetimeInput = await screen.findByLabelText("Start Date & Time");
    const endDatetimeInput = await screen.findByLabelText("End Date & Time");

    // Set end datetime before start datetime
    await user.clear(startDatetimeInput);
    await user.type(startDatetimeInput, "2024-07-15T18:00");
    await user.clear(endDatetimeInput);
    await user.type(endDatetimeInput, "2024-07-15T10:00");

    const submitButton = await screen.findByRole("button", {
      name: "Update Event",
    });
    await user.click(submitButton);

    expect(
      await screen.findByText(
        /end date and time must be after start date and time/i
      )
    ).toBeInTheDocument();
  });

  it("validates that end datetime cannot equal start datetime", async () => {
    renderEditEventPage();

    const startDatetimeInput = await screen.findByLabelText("Start Date & Time");
    const endDatetimeInput = await screen.findByLabelText("End Date & Time");

    const sameDateTime = "2024-07-15T10:00";
    await user.clear(startDatetimeInput);
    await user.type(startDatetimeInput, sameDateTime);
    await user.clear(endDatetimeInput);
    await user.type(endDatetimeInput, sameDateTime);

    const submitButton = await screen.findByRole("button", {
      name: "Update Event",
    });
    await user.click(submitButton);

    expect(
      await screen.findByText(
        /end date and time must be after start date and time/i
      )
    ).toBeInTheDocument();
  });

  it("resets previous errors and shows loading state during submission", async () => {
    fetchEventById.mockResolvedValueOnce({ data: mockEvent });

    // Use a delayed promise to allow testing the loading state
    let resolveUpdate;
    const updatePromise = new Promise((resolve) => {
      resolveUpdate = resolve;
    });
    updateEvent.mockReturnValueOnce(updatePromise);

    render(
      <MemoryRouter>
        <EditEvent />
      </MemoryRouter>
    );

    const nameInput = await screen.findByLabelText("Name");
    const submitButton = await screen.findByRole("button", {
      name: "Update Event",
    });

    // First submit with empty name to cause validation error
    await user.clear(nameInput);
    await user.click(submitButton);
    expect(await screen.findByText(/name is required/i)).toBeInTheDocument();

    // Now fill in name and resubmit
    await user.type(nameInput, "Updated Event");
    await user.click(submitButton);

    // Should reset errors and show loading state
    await waitFor(() => {
      const updatingButton = screen.getByRole("button", {
        name: /updating event/i,
      });
      expect(updatingButton).toBeInTheDocument();
    });

    // Resolve the promise to complete the submission
    resolveUpdate({});

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/events");
    });
  });

  it("converts ISO datetime strings to datetime-local format when loading", async () => {
    const eventWithISO = {
      id: 1,
      name: "Test Event",
      start_datetime: "2024-12-25T15:30:00Z",
      end_datetime: "2024-12-25T23:45:00Z",
      location: "Test Location",
      notes: "Test Notes",
    };

    fetchEventById.mockResolvedValueOnce({ data: eventWithISO });

    renderEditEventPage();

    const startDatetimeInput = await screen.findByLabelText("Start Date & Time");
    const endDatetimeInput = await screen.findByLabelText("End Date & Time");

    // Should convert ISO to datetime-local format (YYYY-MM-DDTHH:mm)
    // Note: The conversion depends on timezone, but should be in local format
    expect(startDatetimeInput.value).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    expect(endDatetimeInput.value).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  });

  it("allows submission with only required fields", async () => {
    updateEvent.mockResolvedValueOnce({});
    renderEditEventPage();

    const nameInput = await screen.findByLabelText("Name");
    const startDatetimeInput = await screen.findByLabelText("Start Date & Time");
    const endDatetimeInput = await screen.findByLabelText("End Date & Time");

    // Clear optional fields
    const locationInput = await screen.findByLabelText("Location");
    const notesInput = await screen.findByLabelText("Notes");
    await user.clear(locationInput);
    await user.clear(notesInput);

    // Update required fields
    await user.clear(nameInput);
    await user.type(nameInput, "Minimal Event");
    await user.clear(startDatetimeInput);
    await user.type(startDatetimeInput, "2024-08-15T14:00");
    await user.clear(endDatetimeInput);
    await user.type(endDatetimeInput, "2024-08-15T20:00");

    const submitButton = await screen.findByRole("button", {
      name: "Update Event",
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(updateEvent).toHaveBeenCalled();
      const callArgs = updateEvent.mock.calls[0][1];
      expect(callArgs.name).toBe("Minimal Event");
      expect(callArgs.location).toBe("");
      expect(callArgs.notes).toBe("");
    });

    expect(mockNavigate).toHaveBeenCalledWith("/events");
  });
});

