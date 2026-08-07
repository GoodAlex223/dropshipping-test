"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ShoppingBag, Lock, Instagram, Send, MessageCircle } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCartStore } from "@/stores/cart.store";
import { checkoutSchema, type CheckoutInput } from "@/lib/validations";
import { DELIVERY_METHODS, DEFAULT_DELIVERY_METHOD_ID } from "@/lib/shipping";
import { formatPrice } from "@/lib/format";
import { checkout } from "@/content/checkout";
import { trackBeginCheckout, trackAddShippingInfo, trackAddPaymentInfo } from "@/lib/analytics";

type CheckoutStep = "information" | "shipping" | "payment";

const STEPS: Array<{ id: CheckoutStep; label: string }> = [
  { id: "information", label: checkout.steps.contacts },
  { id: "shipping", label: checkout.steps.delivery },
  { id: "payment", label: checkout.steps.payment },
];

const inputClass = "border-border-strong bg-background rounded-[10px] border px-3.5 py-3 text-sm";

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { items, getTotalPrice, clearCart } = useCartStore();
  const [mounted, setMounted] = useState(false);
  const [currentStep, setCurrentStep] = useState<CheckoutStep>("information");
  const [isProcessing, setIsProcessing] = useState(false);
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
        country: "UA",
        phone: "",
      },
      shippingMethod: DEFAULT_DELIVERY_METHOD_ID,
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

  // GA4: Track begin checkout (once)
  const checkoutTracked = useRef(false);
  useEffect(() => {
    if (items.length > 0 && !checkoutTracked.current) {
      checkoutTracked.current = true;
      trackBeginCheckout(
        items.map((item) => ({
          item_id: item.productId,
          item_name: item.name,
          item_variant: item.size,
          price: item.price,
          quantity: item.quantity,
        })),
        getTotalPrice()
      );
    }
  }, [items]); // eslint-disable-line react-hooks/exhaustive-deps

  const subtotal = getTotalPrice();
  const selectedShipping = DELIVERY_METHODS.find((m) => m.id === form.watch("shippingMethod"));
  const shippingCost = selectedShipping?.price || 0;
  const total = subtotal + shippingCost;

  const stepIndex = STEPS.findIndex((s) => s.id === currentStep);

  const handleContinueToShipping = async () => {
    const isValid = await form.trigger(["email", "shippingAddress.name", "shippingAddress.phone"]);
    if (isValid) {
      setCurrentStep("shipping");
    }
  };

  const handleContinueToPayment = async () => {
    const isValid = await form.trigger([
      "shippingAddress.city",
      "shippingAddress.line1",
      "shippingMethod",
    ]);
    if (!isValid) return;

    const gaItems = items.map((item) => ({
      item_id: item.productId,
      item_name: item.name,
      item_variant: item.size,
      price: item.price,
      quantity: item.quantity,
    }));
    trackAddShippingInfo(gaItems, getTotalPrice(), selectedShipping?.name || "");
    trackAddPaymentInfo(gaItems, getTotalPrice(), "cod");
    setCurrentStep("payment");
  };

  const handleSubmitOrder = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      const formData = form.getValues();
      const response = await fetch("/api/checkout/create-order", {
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
        throw new Error(data.error || checkout.payment.errors.orderFailed);
      }

      clearCart();
      router.push(`/checkout/confirmation?order=${data.orderNumber}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : checkout.payment.errors.orderFailed);
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
      <div className="container py-16">
        <div className="mx-auto max-w-md text-center">
          <ShoppingBag className="text-muted-foreground mx-auto h-16 w-16" />
          <h1 className="mt-6 text-2xl font-extrabold">{checkout.empty.title}</h1>
          <p className="text-muted-foreground mt-2">{checkout.empty.description}</p>
          <Link
            href="/products"
            className="mt-6 inline-block rounded-[10px] bg-white px-7 py-4 text-[13.5px] font-extrabold tracking-[0.06em] text-black transition-colors hover:bg-[#e5e5e5]"
          >
            {checkout.empty.cta}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-10 lg:py-12">
      <h1 className="text-3xl font-extrabold tracking-tight lg:text-4xl">{checkout.title}</h1>

      {/* Step nav — numbered circles per handoff */}
      <div className="mt-6 mb-8 flex items-center gap-2 text-[13px] font-bold">
        <div className="flex items-center gap-2">
          <Link
            href="/cart"
            aria-label={checkout.steps.cart}
            className="text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full border border-white bg-transparent text-[11.5px]">
              <ShoppingBag className="h-3 w-3" />
            </span>
            <span className="hidden sm:inline">{checkout.steps.cart}</span>
          </Link>
          <span className="text-muted-foreground mx-1">→</span>
        </div>
        {STEPS.map((step, i) => {
          const isActive = i === stepIndex;
          const isDone = i < stepIndex;
          return (
            <div key={step.id} className="flex items-center gap-2">
              {i > 0 && <span className="text-muted-foreground mx-1">→</span>}
              <button
                type="button"
                className={`flex items-center gap-2 ${
                  isActive ? "text-foreground" : "text-muted-foreground"
                } disabled:cursor-default`}
                onClick={() => isDone && setCurrentStep(step.id)}
                disabled={!isDone || isProcessing}
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full border text-[11.5px] ${
                    isActive
                      ? "border-white bg-white text-black"
                      : isDone
                        ? "border-white bg-transparent"
                        : "border-border-strong bg-transparent"
                  }`}
                >
                  {i + 1}
                </span>
                <span className={isActive ? "" : "hidden sm:inline"}>{step.label}</span>
              </button>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(340px,400px)]">
        <div>
          <Form {...form}>
            <form className="space-y-6">
              {/* Step 1 — Контакти */}
              {currentStep === "information" && (
                <div className="bg-card border-border rounded-[20px] border p-7 lg:p-8">
                  <h2 className="text-xl font-extrabold">{checkout.contact.heading}</h2>
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="shippingAddress.name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{checkout.contact.name.label}</FormLabel>
                          <FormControl>
                            <Input
                              className={inputClass}
                              placeholder={checkout.contact.name.placeholder}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="shippingAddress.phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{checkout.contact.phone.label}</FormLabel>
                          <FormControl>
                            <Input
                              type="tel"
                              className={inputClass}
                              placeholder={checkout.contact.phone.placeholder}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem className="sm:col-span-2">
                          <FormLabel>{checkout.contact.email.label}</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              className={inputClass}
                              placeholder={checkout.contact.email.placeholder}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <button
                    type="button"
                    className="mt-6 rounded-[10px] bg-white px-7 py-4 text-[13px] font-extrabold tracking-[0.06em] text-black transition-colors hover:bg-[#e5e5e5]"
                    onClick={handleContinueToShipping}
                  >
                    {checkout.contact.next}
                  </button>
                </div>
              )}

              {/* Step 2 — Доставка */}
              {currentStep === "shipping" && (
                <div className="bg-card border-border rounded-[20px] border p-7 lg:p-8">
                  <h2 className="text-xl font-extrabold">{checkout.delivery.heading}</h2>
                  <FormField
                    control={form.control}
                    name="shippingMethod"
                    render={({ field }) => (
                      <FormItem className="mt-6">
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex flex-col gap-3"
                          >
                            {DELIVERY_METHODS.map((method) => (
                              <Label
                                key={method.id}
                                htmlFor={method.id}
                                className={`flex cursor-pointer items-center justify-between gap-4 rounded-[14px] border p-5 transition-colors ${
                                  field.value === method.id
                                    ? "border-white"
                                    : "border-border-strong hover:border-muted-foreground"
                                }`}
                              >
                                <span className="flex items-center gap-3.5">
                                  <RadioGroupItem value={method.id} id={method.id} />
                                  <span>
                                    <span className="block text-[14.5px] font-bold">
                                      {method.name}
                                    </span>
                                    <span className="text-muted-foreground mt-0.5 block text-[12.5px]">
                                      {method.description}
                                    </span>
                                  </span>
                                </span>
                                <span className="text-sm font-extrabold whitespace-nowrap">
                                  {formatPrice(method.price)}
                                </span>
                              </Label>
                            ))}
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="mt-5 grid gap-4">
                    <FormField
                      control={form.control}
                      name="shippingAddress.city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{checkout.delivery.city.label}</FormLabel>
                          <FormControl>
                            <Input
                              className={inputClass}
                              placeholder={checkout.delivery.city.placeholder}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="shippingAddress.line1"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{checkout.delivery.address.label}</FormLabel>
                          <FormControl>
                            <Input
                              className={inputClass}
                              placeholder={checkout.delivery.address.placeholder}
                              {...field}
                            />
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
                          <FormLabel>{checkout.delivery.notes.label}</FormLabel>
                          <FormControl>
                            <Textarea
                              className={`${inputClass} resize-none`}
                              placeholder={checkout.delivery.notes.placeholder}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="mt-6 flex gap-3">
                    <button
                      type="button"
                      className="border-border-strong hover:border-muted-foreground rounded-[10px] border px-6 py-4 text-[13px] font-bold transition-colors"
                      onClick={() => setCurrentStep("information")}
                    >
                      {checkout.delivery.back}
                    </button>
                    <button
                      type="button"
                      className="rounded-[10px] bg-white px-7 py-4 text-[13px] font-extrabold tracking-[0.06em] text-black transition-colors hover:bg-[#e5e5e5]"
                      onClick={handleContinueToPayment}
                    >
                      {checkout.delivery.next}
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3 — Оплата (no payment processing — COD, spec §2) */}
              {currentStep === "payment" && (
                <div className="bg-card border-border rounded-[20px] border p-7 lg:p-8">
                  <h2 className="text-xl font-extrabold">{checkout.payment.heading}</h2>

                  <div className="border-border mt-6 rounded-[14px] border border-white p-5">
                    <p className="text-[14.5px] font-bold">{checkout.payment.cod.name}</p>
                    <p className="text-muted-foreground mt-0.5 text-[12.5px]">
                      {checkout.payment.cod.description}
                    </p>
                  </div>
                  <p className="text-muted-foreground mt-3 text-sm font-semibold">
                    {checkout.payment.noPrepay}
                  </p>

                  {/* Content-gated prepay block (spec §2): card details when the
                      client supplies them, contact-the-manager fallback until then. */}
                  <div className="bg-muted/40 border-border mt-5 rounded-[14px] border p-5 text-sm">
                    {checkout.payment.prepay.cardNumber ? (
                      <>
                        <p className="font-semibold">{checkout.payment.prepay.cardLabel}</p>
                        <p className="mt-1 text-base font-extrabold tracking-wider">
                          {checkout.payment.prepay.cardNumber}
                        </p>
                        {checkout.payment.prepay.cardHolder && (
                          <p className="text-muted-foreground mt-0.5">
                            {checkout.payment.prepay.cardHolder}
                          </p>
                        )}
                        <p className="text-muted-foreground mt-3">
                          {checkout.payment.prepay.contactLabel}
                        </p>
                      </>
                    ) : (
                      <p className="text-muted-foreground">{checkout.payment.prepay.offer}</p>
                    )}
                    <div className="mt-3 flex items-center gap-4">
                      {checkout.contacts.instagram && (
                        <a
                          href={checkout.contacts.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-foreground hover:text-muted-foreground flex items-center gap-1.5 text-[13px] font-bold transition-colors"
                        >
                          <Instagram className="h-4 w-4" /> Instagram
                        </a>
                      )}
                      {checkout.contacts.whatsapp && (
                        <a
                          href={checkout.contacts.whatsapp}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-foreground hover:text-muted-foreground flex items-center gap-1.5 text-[13px] font-bold transition-colors"
                        >
                          <MessageCircle className="h-4 w-4" /> WhatsApp
                        </a>
                      )}
                      {checkout.contacts.telegram && (
                        <a
                          href={checkout.contacts.telegram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-foreground hover:text-muted-foreground flex items-center gap-1.5 text-[13px] font-bold transition-colors"
                        >
                          <Send className="h-4 w-4" /> Telegram
                        </a>
                      )}
                    </div>
                  </div>

                  {error && (
                    <div className="bg-destructive/10 text-destructive mt-5 rounded-lg p-4 text-sm">
                      {error}
                    </div>
                  )}

                  <div className="mt-6 flex flex-wrap gap-3">
                    <button
                      type="button"
                      className="border-border-strong hover:border-muted-foreground rounded-[10px] border px-6 py-4 text-[13px] font-bold transition-colors disabled:opacity-50"
                      onClick={() => setCurrentStep("shipping")}
                      disabled={isProcessing}
                    >
                      {checkout.payment.back}
                    </button>
                    <button
                      type="button"
                      className="flex-1 rounded-[10px] bg-white px-7 py-4 text-[13px] font-extrabold tracking-[0.06em] text-black transition-colors hover:bg-[#e5e5e5] disabled:cursor-not-allowed disabled:opacity-50"
                      onClick={handleSubmitOrder}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          {checkout.payment.submitting}
                        </span>
                      ) : (
                        `${checkout.payment.submit} — ${formatPrice(total)}`
                      )}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </Form>
        </div>

        {/* Ваше замовлення */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="bg-card border-border rounded-[20px] border p-7">
            <h2 className="text-lg font-extrabold">{checkout.summary.heading}</h2>
            <div className="mt-5 flex max-h-64 flex-col gap-3.5 overflow-y-auto">
              {items.map((item) => {
                const variantLine = [item.color, item.size, checkout.summary.qty(item.quantity)]
                  .filter(Boolean)
                  .join(" · ");
                return (
                  <div
                    key={`${item.productId}-${item.variantId || ""}`}
                    className="flex items-center gap-3.5"
                  >
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={56}
                        height={64}
                        className="h-16 w-14 shrink-0 rounded-[10px] object-cover"
                      />
                    ) : (
                      <div className="bg-muted flex h-16 w-14 shrink-0 items-center justify-center rounded-[10px]">
                        <ShoppingBag className="text-muted-foreground h-5 w-5" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-bold">{item.name}</p>
                      <p className="text-muted-foreground text-xs">{variantLine}</p>
                    </div>
                    <p className="text-[13.5px] font-extrabold whitespace-nowrap">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                );
              })}
            </div>
            <div className="border-border mt-5 flex flex-col gap-2.5 border-t pt-4 text-[13.5px]">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{checkout.summary.itemsLabel}</span>
                <span className="font-bold whitespace-nowrap">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{checkout.summary.shippingLabel}</span>
                <span className="font-bold whitespace-nowrap">{formatPrice(shippingCost)}</span>
              </div>
              <div className="mt-1.5 flex justify-between text-base">
                <span className="font-bold">{checkout.summary.totalLabel}</span>
                <span className="font-extrabold whitespace-nowrap">{formatPrice(total)}</span>
              </div>
            </div>
            <p className="text-muted-foreground mt-4 flex items-center justify-center gap-2 text-xs font-semibold">
              <Lock className="h-3.5 w-3.5" />
              {checkout.secureNote}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
