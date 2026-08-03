import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SizePicker } from "@/components/products/SizePicker";

describe("SizePicker", () => {
  it("renders defaults 180/75 → L with Ukrainian copy", () => {
    render(<SizePicker />);
    expect(screen.getByRole("heading", { name: "Підбір розміру" })).toBeInTheDocument();
    expect(screen.getByLabelText(/Зріст/)).toHaveValue(180);
    expect(screen.getByLabelText(/Вага/)).toHaveValue(75);
    expect(screen.getByTestId("recommended-size")).toHaveTextContent("L");
  });

  it("recomputes on input change (192 → XXL)", () => {
    render(<SizePicker />);
    fireEvent.change(screen.getByLabelText(/Зріст/), { target: { value: "192" } });
    expect(screen.getByTestId("recommended-size")).toHaveTextContent("XXL");
  });

  it("falls back to defaults on cleared input", () => {
    render(<SizePicker />);
    fireEvent.change(screen.getByLabelText(/Зріст/), { target: { value: "" } });
    expect(screen.getByTestId("recommended-size")).toHaveTextContent("L");
  });
});
