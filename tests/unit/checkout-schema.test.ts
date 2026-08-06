import { describe, it, expect } from "vitest";
import { checkoutSchema } from "@/lib/validations";

const validInput = {
  email: "test@example.com",
  shippingAddress: {
    name: "Тест Тестовий",
    line1: "Відділення №12",
    city: "Київ",
    country: "UA",
    phone: "+380501234567",
  },
  shippingMethod: "np-office",
};

describe("checkoutSchema (G2 slim UA form)", () => {
  it("accepts the slim form payload without postalCode/company/line2/state", () => {
    const result = checkoutSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("rejects a missing phone (required for COD fulfillment)", () => {
    const { phone: _phone, ...addressNoPhone } = validInput.shippingAddress;
    const result = checkoutSchema.safeParse({
      ...validInput,
      shippingAddress: addressNoPhone,
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty phone with the Ukrainian message", () => {
    const result = checkoutSchema.safeParse({
      ...validInput,
      shippingAddress: { ...validInput.shippingAddress, phone: "" },
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Вкажіть номер телефону");
    }
  });

  it("still accepts an explicit postalCode (legacy/dormant-path compatibility)", () => {
    const result = checkoutSchema.safeParse({
      ...validInput,
      shippingAddress: { ...validInput.shippingAddress, postalCode: "01001" },
    });
    expect(result.success).toBe(true);
  });

  it("keeps country required", () => {
    const { country: _c, ...addressNoCountry } = validInput.shippingAddress;
    const result = checkoutSchema.safeParse({
      ...validInput,
      shippingAddress: addressNoCountry,
    });
    expect(result.success).toBe(false);
  });
});
