"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft, ArrowRight, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useCartStore, CartItem } from "@/stores/cart.store";
import { cn } from "@/lib/utils";
import { trackViewCart } from "@/lib/analytics";

interface StockInfo {
  productId: string;
  variantId?: string;
  currentStock: number;
  isAvailable: boolean;
}

export default function CartPage() {
  const router = useRouter();
  const { items, updateQuantity, removeItem, clearCart, getTotalPrice } = useCartStore();
  const [stockInfo, setStockInfo] = useState<Map<string, StockInfo>>(new Map());
  const [isValidating, setIsValidating] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Handle hydration mismatch - intentional setState in effect for client hydration
  useEffect(() => {
    setMounted(true); // eslint-disable-line react-hooks/set-state-in-effect
  }, []);

  // GA4: Track cart page view
  useEffect(() => {
    if (mounted && items.length > 0) {
      trackViewCart(
        items.map((item) => ({
          item_id: item.productId,
          item_name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        getTotalPrice()
      );
    }
  }, [mounted]); // eslint-disable-line react-hooks/exhaustive-deps

  // Validate stock for all items
  useEffect(() => {
    if (items.length === 0) return;

    const validateStock = async () => {
      setIsValidating(true);
      const newStockInfo = new Map<string, StockInfo>();

      for (const item of items) {
        try {
          // Fetch current product stock
          const response = await fetch(
            `/api/cart/validate?productId=${item.productId}${item.variantId ? `&variantId=${item.variantId}` : ""}`
          );
          if (response.ok) {
            const data = await response.json();
            const key = `${item.productId}-${item.variantId || ""}`;
            newStockInfo.set(key, {
              productId: item.productId,
              variantId: item.variantId,
              currentStock: data.stock,
              isAvailable: data.isAvailable && data.stock >= item.quantity,
            });
          }
        } catch (error) {
          console.error("Error validating stock:", error);
        }
      }

      setStockInfo(newStockInfo);
      setIsValidating(false);
    };

    validateStock();
  }, [items]);

  const getItemKey = (item: CartItem) => `${item.productId}-${item.variantId || ""}`;

  const getItemStockStatus = (item: CartItem) => {
    const info = stockInfo.get(getItemKey(item));
    if (!info) return null;

    if (!info.isAvailable) {
      if (info.currentStock === 0) return { type: "error", message: "Out of stock" };
      if (info.currentStock < item.quantity) {
        return { type: "warning", message: `Only ${info.currentStock} available` };
      }
    }
    return null;
  };

  const hasStockIssues = () => {
    return items.some((item) => {
      const status = getItemStockStatus(item);
      return status !== null;
    });
  };

  const subtotal = getTotalPrice();
  const shipping = subtotal > 100 ? 0 : 9.99;
  const total = subtotal + shipping;

  if (!mounted) {
    return <CartPageSkeleton />;
  }

  if (items.length === 0) {
    return (
      <div className="container py-16">
        <div className="mx-auto max-w-md text-center">
          <ShoppingBag className="text-muted-foreground mx-auto h-16 w-16" />
          <h1 className="mt-6 text-2xl font-bold">Your cart is empty</h1>
          <p className="text-muted-foreground mt-2">
            Looks like you haven&apos;t added any products to your cart yet.
          </p>
          <Link href="/products">
            <Button className="mt-6">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold">Shopping Cart</h1>
      <p className="text-muted-foreground mt-2">
        {items.length} {items.length === 1 ? "item" : "items"} in your cart
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          {/* Desktop Table */}
          <div className="hidden rounded-lg border md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50%]">Product</TableHead>
                  <TableHead className="text-center">Quantity</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => {
                  const stockStatus = getItemStockStatus(item);
                  return (
                    <TableRow key={getItemKey(item)}>
                      <TableCell>
                        <div className="flex items-center gap-4">
                          {item.image ? (
                            <Image
                              src={item.image}
                              alt={item.name}
                              width={80}
                              height={80}
                              className="h-20 w-20 rounded-md object-cover"
                            />
                          ) : (
                            <div className="bg-muted flex h-20 w-20 items-center justify-center rounded-md">
                              <ShoppingBag className="text-muted-foreground h-8 w-8" />
                            </div>
                          )}
                          <div>
                            <h3 className="font-medium">{item.name}</h3>
                            <p className="text-muted-foreground text-sm">
                              ${item.price.toFixed(2)} each
                            </p>
                            {stockStatus && (
                              <p
                                className={cn(
                                  "mt-1 flex items-center gap-1 text-sm",
                                  stockStatus.type === "error"
                                    ? "text-destructive"
                                    : "text-orange-600"
                                )}
                              >
                                <AlertCircle className="h-3 w-3" />
                                {stockStatus.message}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              updateQuantity(item.productId, item.quantity - 1, item.variantId)
                            }
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Input
                            type="number"
                            min="1"
                            max={item.maxStock}
                            value={item.quantity}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              if (!isNaN(val) && val > 0) {
                                updateQuantity(item.productId, val, item.variantId);
                              }
                            }}
                            className="h-8 w-16 text-center"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              updateQuantity(item.productId, item.quantity + 1, item.variantId)
                            }
                            disabled={item.quantity >= item.maxStock}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${(item.price * item.quantity).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive h-8 w-8"
                          onClick={() => removeItem(item.productId, item.variantId)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards */}
          <div className="space-y-4 md:hidden">
            {items.map((item) => {
              const stockStatus = getItemStockStatus(item);
              return (
                <div key={getItemKey(item)} className="rounded-lg border p-4">
                  <div className="flex gap-4">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        width={96}
                        height={96}
                        className="h-24 w-24 rounded-md object-cover"
                      />
                    ) : (
                      <div className="bg-muted flex h-24 w-24 items-center justify-center rounded-md">
                        <ShoppingBag className="text-muted-foreground h-8 w-8" />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium">{item.name}</h3>
                          <p className="text-muted-foreground text-sm">${item.price.toFixed(2)}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground hover:text-destructive h-8 w-8"
                          onClick={() => removeItem(item.productId, item.variantId)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      {stockStatus && (
                        <p
                          className={cn(
                            "mt-1 flex items-center gap-1 text-sm",
                            stockStatus.type === "error" ? "text-destructive" : "text-orange-600"
                          )}
                        >
                          <AlertCircle className="h-3 w-3" />
                          {stockStatus.message}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity - 1, item.variantId)
                        }
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                          updateQuantity(item.productId, item.quantity + 1, item.variantId)
                        }
                        disabled={item.quantity >= item.maxStock}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Cart Actions */}
          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:justify-between">
            <Link href="/products">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Continue Shopping
              </Button>
            </Link>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="text-destructive hover:text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear Cart
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear your cart?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove all items from your cart. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={clearCart}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Clear Cart
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="rounded-lg border p-6">
            <h2 className="text-lg font-semibold">Order Summary</h2>

            <div className="mt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span>
                  {shipping === 0 ? (
                    <span className="text-green-600">Free</span>
                  ) : (
                    `$${shipping.toFixed(2)}`
                  )}
                </span>
              </div>
              {subtotal < 100 && (
                <p className="text-muted-foreground text-sm">
                  Add ${(100 - subtotal).toFixed(2)} more for free shipping
                </p>
              )}
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>

            {hasStockIssues() && (
              <div className="bg-destructive/10 text-destructive mt-4 rounded-md p-3 text-sm">
                <p className="flex items-center gap-2 font-medium">
                  <AlertCircle className="h-4 w-4" />
                  Some items have stock issues
                </p>
                <p className="text-muted-foreground mt-1">
                  Please update quantities or remove unavailable items before checkout.
                </p>
              </div>
            )}

            <Button
              className="mt-6 w-full"
              size="lg"
              onClick={() => router.push("/checkout")}
              disabled={hasStockIssues() || isValidating}
            >
              {isValidating ? (
                "Validating..."
              ) : (
                <>
                  Proceed to Checkout
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>

            <p className="text-muted-foreground mt-4 text-center text-xs">
              Taxes calculated at checkout
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function CartPageSkeleton() {
  return (
    <div className="container py-8">
      <div className="bg-muted h-9 w-48 animate-pulse rounded" />
      <div className="bg-muted mt-2 h-5 w-32 animate-pulse rounded" />

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-lg border p-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 py-4">
                <div className="bg-muted h-20 w-20 animate-pulse rounded-md" />
                <div className="flex-1 space-y-2">
                  <div className="bg-muted h-5 w-48 animate-pulse rounded" />
                  <div className="bg-muted h-4 w-24 animate-pulse rounded" />
                </div>
                <div className="bg-muted h-8 w-24 animate-pulse rounded" />
                <div className="bg-muted h-5 w-16 animate-pulse rounded" />
              </div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-1">
          <div className="rounded-lg border p-6">
            <div className="bg-muted h-6 w-32 animate-pulse rounded" />
            <div className="mt-4 space-y-3">
              <div className="bg-muted h-4 w-full animate-pulse rounded" />
              <div className="bg-muted h-4 w-full animate-pulse rounded" />
              <div className="bg-muted h-px" />
              <div className="bg-muted h-5 w-full animate-pulse rounded" />
            </div>
            <div className="bg-muted mt-6 h-12 w-full animate-pulse rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
