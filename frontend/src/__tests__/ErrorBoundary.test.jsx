import { render, screen } from "@testing-library/react";
import ErrorBoundary from "../components/ErrorBoundary";
import { vi } from "vitest";
import { MemoryRouter } from "react-router";

function ProblemChild() {
  throw new Error("Test error");
}

describe("ErrorBoundary", () => {
  it("renders children without errors", () => {
    render(
      <ErrorBoundary>
        <p>Safe content</p>
      </ErrorBoundary>
    );
    expect(screen.getByText("Safe content")).toBeInTheDocument();
  });

  it("renders fallback ErrorCard with error message when error occurs", () => {
    vi.spyOn(console, "error").mockImplementation(() => {}); // suppress React error log

    render(
      <MemoryRouter>
        <ErrorBoundary>
          <ProblemChild />
        </ErrorBoundary>
      </MemoryRouter>
    );

    expect(
      screen.getByText(/Something went wrong: Test error/)
    ).toBeInTheDocument();

    expect(screen.getByText("← Back to Home")).toBeInTheDocument();

    vi.restoreAllMocks();
  });
});
