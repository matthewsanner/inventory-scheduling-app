import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DeleteItemModal from "../components/DeleteItemModal";

describe("DeleteItemModal", () => {
  const user = userEvent.setup();

  const defaultProps = {
    open: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    itemName: "Fancy Hat",
  };

  it("renders with the provided item name", () => {
    render(<DeleteItemModal {...defaultProps} />);
    expect(
      screen.getByText(/Are you sure you want to delete/i)
    ).toBeInTheDocument();
    expect(screen.getByText("Fancy Hat")).toBeInTheDocument();
  });

  it("calls onConfirm when 'Yes, I’m sure' is clicked", async () => {
    render(<DeleteItemModal {...defaultProps} />);
    const confirmButton = screen.getByRole("button", {
      name: "Yes, I'm sure",
    });
    await user.click(confirmButton);
    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when 'No, cancel' is clicked", async () => {
    render(<DeleteItemModal {...defaultProps} />);
    const cancelButton = screen.getByRole("button", { name: "No, cancel" });
    await user.click(cancelButton);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it("does not render when open is false", () => {
    render(<DeleteItemModal {...defaultProps} open={false} />);
    expect(screen.queryByTestId("delete-modal")).not.toBeInTheDocument();
  });
});
