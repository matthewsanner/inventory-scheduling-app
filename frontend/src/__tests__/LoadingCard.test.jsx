import { render, screen } from "@testing-library/react";
import LoadingCard from "../components/LoadingCard";

describe("LoadingCard", () => {
  it("renders the default loading message", () => {
    render(<LoadingCard />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders a custom message if provided", () => {
    render(<LoadingCard message="Fetching inventory..." />);
    expect(screen.getByText("Fetching inventory...")).toBeInTheDocument();
  });

  it("renders the spinner", () => {
    render(<LoadingCard />);
    // Spinner is rendered with a role of status by Flowbite for accessibility
    expect(screen.getByRole("status")).toBeInTheDocument();
  });
});
