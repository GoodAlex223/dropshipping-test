"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Elements } from "@stripe/react-stripe-js";
import { Loader2, ShoppingBag, Truck, CreditCard, ChevronRight, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCartStore } from "@/stores/cart.store";
import { checkoutSchema, type CheckoutInput } from "@/lib/validations";
import { getStripe } from "@/lib/stripe-client";
import { PaymentForm } from "@/components/checkout/PaymentForm";

const SHIPPING_METHODS = [
  {
    id: "standard",
    name: "Standard Shipping",
    description: "5-7 business days",
    price: 5.99,
  },
  {
    id: "express",
    name: "Express Shipping",
    description: "2-3 business days",
    price: 12.99,
  },
  {
    id: "overnight",
    name: "Overnight Shipping",
    description: "1 business day",
    price: 24.99,
  },
];

const COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "GB", name: "United Kingdom" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
];

type CheckoutStep = "information" | "shipping" | "payment";

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { items, getTotalPrice, clearCart } = useCartStore();
  const [mounted, setMounted] = useState(false);
  const [currentStep, setCurrentStep] = useState<CheckoutStep>("information");
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<CheckoutInput>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      email: session?.user?.email || "",
      shippingAddress: {
        name: session?.user?.name || "",
        company: "",
        line1: "",
        line2: "",
        city: "",
        state: "",
        postalCode: "",
        country: "US",
        phone: "",
      },
      shippingMethod: "standard",
      customerNotes: "",
    },
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (session?.user?.email) {
      form.setValue("email", session.user.email);
    }
    if (session?.user?.name) {
      form.setValue("shippingAddress.name", session.user.name);
    }
  }, [session, form]);

  const subtotal = getTotalPrice();
  const selectedShipping = SHIPPING_METHODS.find((m) => m.id === form.watch("shippingMethod"));
  const shippingCost = selectedShipping?.price || 0;
  const total = subtotal + shippingCost;

  const handleContinueToShipping = async () => {
    const isValid = await form.trigger([
      "email",
      "shippingAddress.name",
      "shippingAddress.line1",
      "shippingAddress.city",
      "shippingAddress.postalCode",
      "shippingAddress.country",
    ]);
    if (isValid) {
      setCurrentStep("shipping");
    }
  };

  const handleContinueToPayment = async () => {
    const isValid = await form.trigger("shippingMethod");
    if (!isValid) return;

    setIsProcessing(true);
    setError(null);

    try {
      const formData = form.getValues();
      const response = await fetch("/api/checkout/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          items: items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create payment");
      }

      setClientSecret(data.clientSecret);
      setPaymentIntentId(data.paymentIntentId);
      setOrderNumber(data.orderNumber);
      setCurrentStep("payment");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentSuccess = async () => {
    if (!paymentIntentId) return;

    setIsProcessing(true);
    setError(null);

    try {
      const formData = form.getValues();
      const response = await fetch("/api/checkout/confirm-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentIntentId,
          ...formData,
          items: items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to confirm order");
      }

      clearCart();
      router.push(`/checkout/confirmation?order=${data.orderNumber}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to confirm order");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!mounted) {
    return (
      <div className="container flex min-h-[60vh] items-center justify-center">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container py-12">
        <div className="mx-auto max-w-md text-center">
          <ShoppingBag className="text-muted-foreground mx-auto h-16 w-16" />
          <h1 className="mt-6 text-2xl font-semibold">Your cart is empty</h1>
          <p className="text-muted-foreground mt-2">
            Add some items to your cart before checking out.
          </p>
          <Button className="mt-6" onClick={() => router.push("/products")}>
            Browse Products
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Checkout</h1>
        <div className="mt-4 flex items-center gap-2 text-sm">
          <button
            className={`flex items-center gap-1 ${
              currentStep === "information" ? "text-primary font-medium" : "text-muted-foreground"
            }`}
            onClick={() => setCurrentStep("information")}
            disabled={currentStep === "payment" && isProcessing}
          >
            <MapPin className="h-4 w-4" />
            Information
          </button>
          <ChevronRight className="text-muted-foreground h-4 w-4" />
          <button
            className={`flex items-center gap-1 ${
              currentStep === "shipping" ? "text-primary font-medium" : "text-muted-foreground"
            }`}
            onClick={() => currentStep !== "information" && setCurrentStep("shipping")}
            disabled={currentStep === "information" || isProcessing}
          >
            <Truck className="h-4 w-4" />
            Shipping
          </button>
          <ChevronRight className="text-muted-foreground h-4 w-4" />
          <span
            className={`flex items-center gap-1 ${
              currentStep === "payment" ? "text-primary font-medium" : "text-muted-foreground"
            }`}
          >
            <CreditCard className="h-4 w-4" />
            Payment
          </span>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <Form {...form}>
            <form className="space-y-6">
              {/* Contact Information */}
              {currentStep === "information" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Contact & Shipping Address
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="your@email.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="shippingAddress.name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="John Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="shippingAddress.company"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company (optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="Company name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="shippingAddress.line1"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Input placeholder="123 Main St" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="shippingAddress.line2"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Apartment, suite, etc. (optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Apt 4B" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid gap-4 sm:grid-cols-3">
                      <FormField
                        control={form.control}
                        name="shippingAddress.city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input placeholder="City" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="shippingAddress.state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State / Province</FormLabel>
                            <FormControl>
                              <Input placeholder="State" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="shippingAddress.postalCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Postal Code</FormLabel>
                            <FormControl>
                              <Input placeholder="12345" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="shippingAddress.country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Country</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select country" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {COUNTRIES.map((country) => (
                                  <SelectItem key={country.code} value={country.code}>
                                    {country.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="shippingAddress.phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone (optional)</FormLabel>
                            <FormControl>
                              <Input type="tel" placeholder="+1 (555) 000-0000" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button type="button" className="w-full" onClick={handleContinueToShipping}>
                      Continue to Shipping
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Shipping Method */}
              {currentStep === "shipping" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="h-5 w-5" />
                      Shipping Method
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="shippingMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="space-y-3"
                            >
                              {SHIPPING_METHODS.map((method) => (
                                <Label
                                  key={method.id}
                                  htmlFor={method.id}
                                  className="hover:bg-muted/50 [&:has([data-state=checked])]:border-primary flex cursor-pointer items-center justify-between rounded-lg border p-4"
                                >
                                  <div className="flex items-center gap-3">
                                    <RadioGroupItem value={method.id} id={method.id} />
                                    <div>
                                      <p className="font-medium">{method.name}</p>
                                      <p className="text-muted-foreground text-sm">
                                        {method.description}
                                      </p>
                                    </div>
                                  </div>
                                  <span className="font-medium">${method.price.toFixed(2)}</span>
                                </Label>
                              ))}
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="customerNotes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Order Notes (optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Special instructions for your order..."
                              className="resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {error && (
                      <div className="bg-destructive/10 text-destructive rounded-lg p-4 text-sm">
                        {error}
                      </div>
                    )}

                    <div className="flex gap-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setCurrentStep("information")}
                        disabled={isProcessing}
                      >
                        Back
                      </Button>
                      <Button
                        type="button"
                        className="flex-1"
                        onClick={handleContinueToPayment}
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            Continue to Payment
                            <ChevronRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Payment */}
              {currentStep === "payment" && clientSecret && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Payment
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Elements
                      stripe={getStripe()}
                      options={{
                        clientSecret,
                        appearance: {
                          theme: "stripe",
                          variables: {
                            colorPrimary: "#0f172a",
                          },
                        },
                      }}
                    >
                      <PaymentForm
                        onSuccess={handlePaymentSuccess}
                        onBack={() => setCurrentStep("shipping")}
                        isProcessing={isProcessing}
                        setIsProcessing={setIsProcessing}
                        error={error}
                        setError={setError}
                      />
                    </Elements>
                  </CardContent>
                </Card>
              )}
            </form>
          </Form>
        </div>

        {/* Order Summary */}
        <div className="lg:sticky lg:top-8 lg:self-start">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="max-h-64 space-y-4 overflow-y-auto">
                {items.map((item) => (
                  <div key={`${item.productId}-${item.variantId || ""}`} className="flex gap-4">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-16 w-16 rounded-md object-cover"
                      />
                    ) : (
                      <div className="bg-muted flex h-16 w-16 items-center justify-center rounded-md">
                        <ShoppingBag className="text-muted-foreground h-6 w-6" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="line-clamp-2 text-sm font-medium">{item.name}</p>
                      <p className="text-muted-foreground text-sm">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-medium">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>
                    {selectedShipping ? `$${shippingCost.toFixed(2)}` : "Calculated at next step"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tax</span>
                  <span>$0.00</span>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>

              {orderNumber && (
                <div className="bg-muted rounded-lg p-3 text-center text-sm">
                  Order #{orderNumber}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
