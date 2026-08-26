import { screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderWithIntl } from "../helpers/render-with-intl";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

import { ProductForm } from "@/components/admin/ProductForm";

// jsdom has no ResizeObserver; ProductForm's isActive/isFeatured/excludeFromFeed
// switches use Radix Switch, whose internal useSize hook needs ResizeObserver
// and otherwise throws. No other test in this file mounts something that
// needs it either, so this is scoped here rather than the global test setup
// (see tests/unit/filter-bar.test.tsx for the same pattern with Radix Slider).
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as unknown as { ResizeObserver: typeof ResizeObserverMock }).ResizeObserver =
  ResizeObserverMock;

const fetchMock = vi.fn();

const product = {
  id: "p1",
  name: "Светр на блискавці, чорний",
  slug: "svetr-blyskavka-chornyi",
  description: "Опис",
  shortDesc: "Короткий",
  price: "1579",
  comparePrice: null,
  costPrice: null,
  sku: "MRX-103",
  barcode: null,
  brand: null,
  mpn: null,
  styleGroup: "svetr-blyskavka",
  excludeFromFeed: true,
  stock: 20,
  categoryId: "cat-svetry",
  isActive: true,
  isFeatured: false,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockImplementation(async (url: string) => {
    if (url.startsWith("/api/admin/categories")) {
      return {
        ok: true,
        json: async () => [{ id: "cat-svetry", name: "Светри", parentId: "c-odyah" }],
      };
    }
    return { ok: true, json: async () => ({ id: "p1" }) };
  });
});

afterEach(() => vi.unstubAllGlobals());

describe("ProductForm — G16 fields", () => {
  it("renders styleGroup and excludeFromFeed from the product", async () => {
    renderWithIntl(<ProductForm product={product} isEdit />);
    expect(screen.getByLabelText("Група кольорів")).toHaveValue("svetr-blyskavka");
    expect(screen.getByRole("switch", { name: "Не показувати у Google Shopping" })).toBeChecked();
  });

  it("submits styleGroup and excludeFromFeed in the PUT payload", async () => {
    renderWithIntl(<ProductForm product={product} isEdit />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalled()); // categories loaded
    fireEvent.change(screen.getByLabelText("Група кольорів"), { target: { value: "new-group" } });
    fireEvent.click(screen.getByRole("switch", { name: "Не показувати у Google Shopping" }));
    fireEvent.click(screen.getByRole("button", { name: "Оновити товар" }));

    await waitFor(() => {
      const put = fetchMock.mock.calls.find(([, init]) => init?.method === "PUT");
      expect(put).toBeDefined();
      const body = JSON.parse(put![1].body as string);
      expect(body.styleGroup).toBe("new-group");
      expect(body.excludeFromFeed).toBe(false);
    });
  });

  it("sends styleGroup: null when the field is emptied", async () => {
    renderWithIntl(<ProductForm product={product} isEdit />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    fireEvent.change(screen.getByLabelText("Група кольорів"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Оновити товар" }));
    await waitFor(() => {
      const put = fetchMock.mock.calls.find(([, init]) => init?.method === "PUT");
      expect(JSON.parse(put![1].body as string).styleGroup).toBeNull();
    });
  });
});
