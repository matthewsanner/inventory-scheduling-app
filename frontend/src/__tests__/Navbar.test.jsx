import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import Navbar from "../components/Navbar";

describe("Navbar", () => {
  it("renders the brand name", () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );
    expect(screen.getByText(/Inventory App/i)).toBeInTheDocument();
  });

  it("renders the correct links", () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );
    expect(screen.getByText(/Home/i).getAttribute("href")).toBe("/");
    expect(screen.getByText(/Items/i).getAttribute("href")).toBe("/items");
  });
});
