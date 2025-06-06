import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import ErrorCard from "../components/ErrorCard";

describe("ErrorCard", () => {
  const user = userEvent.setup();

  it("renders the provided error message", () => {
    render(
      <MemoryRouter>
        <ErrorCard message="Something went wrong." onBack={() => {}} />
      </MemoryRouter>
    );
    expect(screen.getByText("Something went wrong.")).toBeInTheDocument();
  });

  it("calls onBack when the Back button is clicked", async () => {
    const mockOnBack = vi.fn();
    render(
      <MemoryRouter>
        <ErrorCard message="Error occurred" onBack={mockOnBack} />
      </MemoryRouter>
    );

    const backButton = screen.getByRole("button", { name: "← Back to Items" });
    await user.click(backButton);

    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });
});
