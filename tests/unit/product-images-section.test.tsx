import { screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderWithIntl } from "../helpers/render-with-intl";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn() } }));

import { ProductImagesSection } from "@/components/admin/ProductImagesSection";

const fetchMock = vi.fn();
const rows = [
  {
    id: "i1",
    productId: "p1",
    url: "https://pub.r2.dev/products/1-front.jpg",
    alt: "Спереду",
    position: 0,
  },
  {
    id: "i2",
    productId: "p1",
    url: "https://pub.r2.dev/products/2-back.jpg",
    alt: "Ззаду",
    position: 1,
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockImplementation(async (_url: string, init?: RequestInit) => {
    if (!init || init.method === undefined) return { ok: true, json: async () => rows };
    return { ok: true, json: async () => rows };
  });
});
afterEach(() => vi.unstubAllGlobals());

describe("ProductImagesSection", () => {
  it("loads the product's images into the uploader grid", async () => {
    renderWithIntl(<ProductImagesSection productId="p1" />);
    expect(await screen.findByAltText("Спереду")).toBeInTheDocument();
    expect(screen.getByAltText("Ззаду")).toBeInTheDocument();
    expect(fetchMock.mock.calls[0][0]).toBe("/api/admin/products/p1/images");
  });

  it("removing a persisted image calls DELETE on its item route", async () => {
    renderWithIntl(<ProductImagesSection productId="p1" />);
    await screen.findByAltText("Ззаду");
    // ImageUploader's remove buttons are icon-only; the second one belongs to i2.
    // Filtering by className substring "destructive" is unreliable here: the
    // shadcn Button's UNCONDITIONAL base class already contains
    // "aria-invalid:border-destructive" etc. on every variant (see
    // src/components/ui/button.tsx), so a className check matches the grip
    // buttons too. `data-variant` is the attribute Button actually sets per
    // variant, so it isolates the real destructive-styled remove buttons.
    const removeButtons = screen
      .getAllByRole("button")
      .filter((b) => b.getAttribute("data-variant") === "destructive");
    fireEvent.click(removeButtons[1]);
    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/admin/products/p1/images/i2",
        expect.objectContaining({ method: "DELETE" })
      )
    );
    await waitFor(() => expect(screen.queryByAltText("Ззаду")).toBeNull());
  });

  it("hides the save-order button until the order is dirty", async () => {
    renderWithIntl(<ProductImagesSection productId="p1" />);
    await screen.findByAltText("Ззаду");
    expect(screen.queryByRole("button", { name: "Зберегти порядок" })).toBeNull();
  });
});
