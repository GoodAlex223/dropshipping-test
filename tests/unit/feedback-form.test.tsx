import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

import { toast } from "sonner";
import { FeedbackForm } from "@/app/(shop)/feedback/feedback-form";

const fetchMock = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("FeedbackForm", () => {
  it("submits message-only feedback and shows the success box", async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ code: "FEEDBACK_SENT" }) });
    render(<FeedbackForm />);

    fireEvent.change(screen.getByLabelText("Повідомлення"), {
      target: { value: "Кнопка кошика не працює" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Надіслати" }));

    await waitFor(() => expect(screen.getByText("Дякуємо!")).toBeInTheDocument());
    expect(screen.getByRole("status")).toHaveTextContent("Дякуємо!");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/feedback");
    expect(JSON.parse(init.body).message).toBe("Кнопка кошика не працює");
  });

  it("keeps the honeypot field out of sight and out of the tab order", () => {
    render(<FeedbackForm />);
    const honeypot = document.querySelector('input[name="website"]');
    expect(honeypot).not.toBeNull();
    expect(honeypot!.getAttribute("tabindex")).toBe("-1");
    expect(honeypot!.closest('div[aria-hidden="true"]')).not.toBeNull();
  });

  it("maps SEND_FAILED to the Ukrainian toast and keeps the form on screen", async () => {
    fetchMock.mockResolvedValue({ ok: false, json: async () => ({ code: "SEND_FAILED" }) });
    render(<FeedbackForm />);

    fireEvent.change(screen.getByLabelText("Повідомлення"), {
      target: { value: "Каталог вантажиться повільно" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Надіслати" }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Не вдалося надіслати повідомлення. Спробуйте пізніше."
      )
    );
    expect(screen.getByRole("button", { name: "Надіслати" })).toBeInTheDocument();
  });

  it("falls back to the generic Ukrainian error when fetch rejects", async () => {
    fetchMock.mockRejectedValue(new Error("offline"));
    render(<FeedbackForm />);

    fireEvent.change(screen.getByLabelText("Повідомлення"), {
      target: { value: "Каталог вантажиться повільно" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Надіслати" }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Не вдалося надіслати повідомлення. Спробуйте пізніше."
      )
    );
  });
});
