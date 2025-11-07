import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useNavigate } from "react-router";
import NewEvent from "../pages/NewEvent";
import { mockEventFormData } from "./testUtils";
import { createEvent } from "../services/NewEventService";

// Mock service module
vi.mock("../services/NewEventService", () => ({
  createEvent: vi.fn(),
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
const user = userEvent.setup();

const renderNewEventPage = async () => {
  render(
    <MemoryRouter>
      <NewEvent />
    </MemoryRouter>
  );

  await waitFor(() =>
    expect(screen.getByText("Add New Event")).toBeInTheDocument()
  );
};

describe("NewEvent Page", () => {
  beforeEach(() => {
    useNavigate.mockReturnValue(mockNavigate);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders the form with all required fields", async () => {
    renderNewEventPage();

    expect(screen.getByText("Add New Event")).toBeInTheDocument();

    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Start Date & Time")).toBeInTheDocument();
    expect(screen.getByLabelText("End Date & Time")).toBeInTheDocument();
    expect(screen.getByLabelText("Location")).toBeInTheDocument();
    expect(screen.getByLabelText("Notes")).toBeInTheDocument();
  });

  it("handles form input changes correctly", async () => {
    renderNewEventPage();

    const nameInput = screen.getByLabelText("Name");
    const startDatetimeInput = screen.getByLabelText("Start Date & Time");
    const endDatetimeInput = screen.getByLabelText("End Date & Time");
    const locationInput = screen.getByLabelText("Location");
    const notesInput = screen.getByLabelText("Notes");

    await user.type(nameInput, mockEventFormData.name);
    await user.type(startDatetimeInput, mockEventFormData.start_datetime);
    await user.type(endDatetimeInput, mockEventFormData.end_datetime);
    await user.type(locationInput, mockEventFormData.location);
    await user.type(notesInput, mockEventFormData.notes);

    expect(nameInput.value).toBe(mockEventFormData.name);
    expect(startDatetimeInput.value).toBe(mockEventFormData.start_datetime);
    expect(endDatetimeInput.value).toBe(mockEventFormData.end_datetime);
    expect(locationInput.value).toBe(mockEventFormData.location);
    expect(notesInput.value).toBe(mockEventFormData.notes);
  });

  it("submits the form successfully and navigates to events page", async () => {
    renderNewEventPage();
    createEvent.mockResolvedValueOnce({});

    await user.type(screen.getByLabelText("Name"), mockEventFormData.name);
    await user.type(
      screen.getByLabelText("Start Date & Time"),
      mockEventFormData.start_datetime
    );
    await user.type(
      screen.getByLabelText("End Date & Time"),
      mockEventFormData.end_datetime
    );
    await user.type(
      screen.getByLabelText("Location"),
      mockEventFormData.location
    );
    await user.type(screen.getByLabelText("Notes"), mockEventFormData.notes);

    const submitButton = screen.getByRole("button", { name: "Add Event" });
    await user.click(submitButton);

    await waitFor(() => {
      expect(createEvent).toHaveBeenCalled();
      const callArgs = createEvent.mock.calls[0][0];
      expect(callArgs.name).toBe(mockEventFormData.name);
      expect(callArgs.location).toBe(mockEventFormData.location);
      expect(callArgs.notes).toBe(mockEventFormData.notes);
      expect(callArgs.start_datetime).toBeDefined();
      expect(callArgs.end_datetime).toBeDefined();
    });

    expect(mockNavigate).toHaveBeenCalledWith("/events");
  });

  it("handles form submission error and shows ErrorCard", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    createEvent.mockRejectedValueOnce(new Error("API error"));
    renderNewEventPage();

    await user.type(screen.getByLabelText("Name"), mockEventFormData.name);
    await user.type(
      screen.getByLabelText("Start Date & Time"),
      mockEventFormData.start_datetime
    );
    await user.type(
      screen.getByLabelText("End Date & Time"),
      mockEventFormData.end_datetime
    );
    await user.click(screen.getByRole("button", { name: "Add Event" }));

    await waitFor(() => {
      expect(
        screen.getByText("Failed to create event. Please try again later.")
      ).toBeInTheDocument();
    });

    const backButton = screen.getByRole("button", {
      name: "← Back to Events",
    });
    await user.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith("/events");

    consoleErrorSpy.mockRestore();
  });

  it("navigates back to events page when Cancel is clicked", async () => {
    renderNewEventPage();

    const cancelButton = screen.getByRole("button", { name: "Cancel" });
    await user.click(cancelButton);

    expect(mockNavigate).toHaveBeenCalledWith("/events");
  });

  it("prevents form submission if required fields are empty", async () => {
    renderNewEventPage();

    const submitButton = screen.getByRole("button", { name: "Add Event" });
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
    renderNewEventPage();

    const nameInput = screen.getByLabelText("Name");
    const startDatetimeInput = screen.getByLabelText("Start Date & Time");
    const endDatetimeInput = screen.getByLabelText("End Date & Time");

    await user.type(nameInput, mockEventFormData.name);
    // Set end datetime before start datetime
    await user.type(startDatetimeInput, "2024-07-15T18:00");
    await user.type(endDatetimeInput, "2024-07-15T10:00");

    const submitButton = screen.getByRole("button", { name: "Add Event" });
    await user.click(submitButton);

    expect(
      await screen.findByText(
        /end date and time must be after start date and time/i
      )
    ).toBeInTheDocument();
  });

  it("validates that end datetime cannot equal start datetime", async () => {
    renderNewEventPage();

    const nameInput = screen.getByLabelText("Name");
    const startDatetimeInput = screen.getByLabelText("Start Date & Time");
    const endDatetimeInput = screen.getByLabelText("End Date & Time");

    await user.type(nameInput, mockEventFormData.name);
    const sameDateTime = "2024-07-15T10:00";
    await user.type(startDatetimeInput, sameDateTime);
    await user.type(endDatetimeInput, sameDateTime);

    const submitButton = screen.getByRole("button", { name: "Add Event" });
    await user.click(submitButton);

    expect(
      await screen.findByText(
        /end date and time must be after start date and time/i
      )
    ).toBeInTheDocument();
  });

  it("resets previous errors and shows loading state during submission", async () => {
    // Use a delayed promise to allow testing the loading state
    let resolveCreate;
    const createPromise = new Promise((resolve) => {
      resolveCreate = resolve;
    });
    createEvent.mockReturnValueOnce(createPromise);

    renderNewEventPage();

    const nameInput = screen.getByLabelText("Name");
    const startDatetimeInput = screen.getByLabelText("Start Date & Time");
    const endDatetimeInput = screen.getByLabelText("End Date & Time");
    const submitButton = screen.getByRole("button", { name: "Add Event" });

    // First submit without name, causes validation errors
    await user.click(submitButton);
    expect(await screen.findByText(/name is required/i)).toBeInTheDocument();

    // Now fill and resubmit
    await user.type(nameInput, "Summer Festival");
    await user.type(startDatetimeInput, mockEventFormData.start_datetime);
    await user.type(endDatetimeInput, mockEventFormData.end_datetime);
    await user.click(submitButton);

    // Should reset errors and show loading state
    await waitFor(() => {
      const updatedButton = screen.getByRole("button", {
        name: /adding event/i,
      });
      expect(updatedButton).toHaveTextContent(/adding event/i);
    });

    // Resolve the promise to complete the submission
    resolveCreate({});

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/events");
    });
  });

  it("allows submission with only required fields", async () => {
    renderNewEventPage();
    createEvent.mockResolvedValueOnce({});

    await user.type(screen.getByLabelText("Name"), mockEventFormData.name);
    await user.type(
      screen.getByLabelText("Start Date & Time"),
      mockEventFormData.start_datetime
    );
    await user.type(
      screen.getByLabelText("End Date & Time"),
      mockEventFormData.end_datetime
    );

    const submitButton = screen.getByRole("button", { name: "Add Event" });
    await user.click(submitButton);

    await waitFor(() => {
      expect(createEvent).toHaveBeenCalled();
      const callArgs = createEvent.mock.calls[0][0];
      expect(callArgs.name).toBe(mockEventFormData.name);
      expect(callArgs.location).toBe("");
      expect(callArgs.notes).toBe("");
    });

    expect(mockNavigate).toHaveBeenCalledWith("/events");
  });
});

