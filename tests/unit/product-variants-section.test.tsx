import { screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderWithIntl } from "../helpers/render-with-intl";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

import { toast } from "sonner";
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

  it("edits an existing row via PATCH on blur — value persists, stock is coerced to a number", async () => {
    renderWithIntl(<ProductVariantsSection productId="p1" />);
    await screen.findByDisplayValue("Чорний");

    // Row order from the fixture: v1 (Розмір/M) then v2 (Колір/Чорний), both
    // before the add row — index 0 is v1's "Значення" input.
    const valueInputs = screen.getAllByRole("textbox", { name: "Значення" });
    fireEvent.change(valueInputs[0], { target: { value: "XL" } });
    fireEvent.blur(valueInputs[0]);

    await waitFor(() => {
      const patchCall = fetchMock.mock.calls.find(
        ([url, init]) => url === "/api/admin/products/p1/variants/v1" && init?.method === "PATCH"
      );
      expect(patchCall).toBeDefined();
      expect(JSON.parse(patchCall![1].body as string)).toEqual({ value: "XL" });
    });

    // v2's "Залишок" input — same index convention as above.
    const stockInputs = screen.getAllByRole("spinbutton", { name: "Залишок" });
    fireEvent.change(stockInputs[1], { target: { value: "9" } });
    fireEvent.blur(stockInputs[1]);

    await waitFor(() => {
      const patchCall = fetchMock.mock.calls.find(
        ([url, init]) => url === "/api/admin/products/p1/variants/v2" && init?.method === "PATCH"
      );
      expect(patchCall).toBeDefined();
      const body = JSON.parse(patchCall![1].body as string);
      // The API's Zod schema is z.number().int().min(0) and 400s on a string
      // — proving the edit path coerces the same way the add path already does.
      expect(body).toEqual({ stock: 9 });
      expect(typeof body.stock).toBe("number");
    });
  });

  it("surfaces the Ukrainian VALIDATION_ERROR toast on add — never the English `error` text", async () => {
    fetchMock.mockImplementation(async (_url: string, init?: RequestInit) => {
      if (!init || init.method === undefined) return { ok: true, json: async () => rows };
      if (init.method === "POST") {
        return {
          ok: false,
          json: async () => ({ error: "Invalid enum value", code: "VALIDATION_ERROR" }),
        };
      }
      return { ok: true, json: async () => ({}) };
    });
    renderWithIntl(<ProductVariantsSection productId="p1" />);
    await screen.findByDisplayValue("Чорний");

    fireEvent.change(screen.getAllByRole("textbox", { name: "Значення" }).at(-1)!, {
      target: { value: "L" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Додати варіант" }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Перевірте назву, значення та залишок варіанта — щось не так."
      )
    );
    expect(toast.error).not.toHaveBeenCalledWith("Invalid enum value");
  });

  it("surfaces the Ukrainian DUPLICATE_VARIANT toast on add — never the English `error` text", async () => {
    fetchMock.mockImplementation(async (_url: string, init?: RequestInit) => {
      if (!init || init.method === undefined) return { ok: true, json: async () => rows };
      if (init.method === "POST") {
        return {
          ok: false,
          json: async () => ({
            error: "This variant already exists on the product",
            code: "DUPLICATE_VARIANT",
          }),
        };
      }
      return { ok: true, json: async () => ({}) };
    });
    renderWithIntl(<ProductVariantsSection productId="p1" />);
    await screen.findByDisplayValue("Чорний");

    fireEvent.change(screen.getAllByRole("textbox", { name: "Значення" }).at(-1)!, {
      target: { value: "M" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Додати варіант" }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Варіант із такими назвою та значенням уже існує для цього товару."
      )
    );
    expect(toast.error).not.toHaveBeenCalledWith("This variant already exists on the product");
  });

  it("surfaces the Ukrainian VARIANT_REFERENCED toast on delete — never the English `error` text", async () => {
    fetchMock.mockImplementation(async (_url: string, init?: RequestInit) => {
      if (!init || init.method === undefined) return { ok: true, json: async () => rows };
      if (init.method === "DELETE") {
        return {
          ok: false,
          json: async () => ({
            error: "Cannot delete a variant that is referenced by orders or carts.",
            code: "VARIANT_REFERENCED",
          }),
        };
      }
      return { ok: true, json: async () => ({}) };
    });
    renderWithIntl(<ProductVariantsSection productId="p1" />);
    await screen.findByDisplayValue("Чорний");

    fireEvent.click(screen.getAllByRole("button", { name: "Видалити" })[1]);

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Неможливо видалити варіант, на який посилаються замовлення або кошики. Замість цього встановіть залишок 0."
      )
    );
    expect(toast.error).not.toHaveBeenCalledWith(
      "Cannot delete a variant that is referenced by orders or carts."
    );
    // The refused row is never optimistically removed.
    expect(await screen.findByDisplayValue("Чорний")).toBeInTheDocument();
  });
});
