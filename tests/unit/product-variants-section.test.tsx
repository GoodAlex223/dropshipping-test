import { screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderWithIntl } from "../helpers/render-with-intl";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

import { ProductVariantsSection } from "@/components/admin/ProductVariantsSection";

const fetchMock = vi.fn();
const rows = [
  { id: "v1", productId: "p1", name: "Розмір", value: "M", stock: 5 },
  { id: "v2", productId: "p1", name: "Колір", value: "Чорний", stock: 20 },
];

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockImplementation(async (_url: string, init?: RequestInit) => {
    if (!init || init.method === undefined) return { ok: true, json: async () => rows };
    if (init.method === "POST")
      return {
        ok: true,
        json: async () => ({ id: "v3", productId: "p1", ...JSON.parse(init.body as string) }),
      };
    return { ok: true, json: async () => ({}) };
  });
});
afterEach(() => vi.unstubAllGlobals());

describe("ProductVariantsSection", () => {
  it("loads and lists the product's variants", async () => {
    renderWithIntl(<ProductVariantsSection productId="p1" />);
    expect(await screen.findByDisplayValue("Чорний")).toBeInTheDocument();
    expect(screen.getByDisplayValue("M")).toBeInTheDocument();
    expect(fetchMock.mock.calls[0][0]).toBe("/api/admin/products/p1/variants");
  });

  // The guard as executed: the name is a Select, never a free-text input.
  it("offers the variant name only as a select — no text input named «Назва»", async () => {
    renderWithIntl(<ProductVariantsSection productId="p1" />);
    await screen.findByDisplayValue("Чорний");
    const combos = screen.getAllByRole("combobox");
    expect(combos.length).toBeGreaterThanOrEqual(1); // the add-row select (+ one per row)
    expect(screen.queryByRole("textbox", { name: "Назва" })).toBeNull();
    expect(screen.getAllByRole("textbox", { name: "Значення" }).length).toBeGreaterThanOrEqual(1);
  });

  it("adds a variant with the canonical default name «Розмір»", async () => {
    renderWithIntl(<ProductVariantsSection productId="p1" />);
    await screen.findByDisplayValue("Чорний");
    // Rows and the add row share aria-labels; the add row is the LAST match.
    fireEvent.change(screen.getAllByRole("textbox", { name: "Значення" }).at(-1)!, {
      target: { value: "L" },
    });
    fireEvent.change(screen.getAllByRole("spinbutton", { name: "Залишок" }).at(-1)!, {
      target: { value: "5" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Додати варіант" }));

    await waitFor(() => {
      const post = fetchMock.mock.calls.find(([, init]) => init?.method === "POST");
      expect(post).toBeDefined();
      expect(JSON.parse(post![1].body as string)).toEqual({ name: "Розмір", value: "L", stock: 5 });
    });
    expect(await screen.findByDisplayValue("L")).toBeInTheDocument();
  });

  it("deletes a row via DELETE on the item route", async () => {
    renderWithIntl(<ProductVariantsSection productId="p1" />);
    await screen.findByDisplayValue("Чорний");
    fireEvent.click(screen.getAllByRole("button", { name: "Видалити" })[1]);
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/admin/products/p1/variants/v2",
        expect.objectContaining({ method: "DELETE" })
      )
    );
    await waitFor(() => expect(screen.queryByDisplayValue("Чорний")).toBeNull());
  });
});
