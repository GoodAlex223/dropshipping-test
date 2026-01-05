import { Suspense } from "react";
import { CheckCircle2, Package, Mail, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";

interface ConfirmationPageProps {
  searchParams: Promise<{ order?: string }>;
}

async function OrderConfirmation({ orderNumber }: { orderNumber: string }) {
  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: {
      items: true,
    },
  });

  if (!order) {
    notFound();
  }

  const shippingAddress = order.shippingAddress as {
    name: string;
    company?: string;
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
  };

  return (
    <div className="container py-12">
      <div className="mx-auto max-w-2xl">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="mt-6 text-3xl font-bold">Order Confirmed!</h1>
          <p className="text-muted-foreground mt-2">
            Thank you for your order. We&apos;ve sent a confirmation email to{" "}
            <span className="text-foreground font-medium">{order.email}</span>
          </p>
          <p className="mt-4 text-lg font-medium">Order #{order.orderNumber}</p>
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Order Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Order Items */}
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-medium">{item.productName}</p>
                    {item.variantInfo && (
                      <p className="text-muted-foreground text-sm">{item.variantInfo}</p>
                    )}
                    <p className="text-muted-foreground text-sm">
                      Qty: {item.quantity} × ${Number(item.unitPrice).toFixed(2)}
                    </p>
                  </div>
                  <p className="font-medium">${Number(item.totalPrice).toFixed(2)}</p>
                </div>
              ))}
            </div>

            <Separator />

            {/* Totals */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${Number(order.subtotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span>${Number(order.shippingCost).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax</span>
                <span>${Number(order.tax).toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>${Number(order.total).toFixed(2)}</span>
              </div>
            </div>

            <Separator />

            {/* Shipping Address */}
            <div>
              <h3 className="mb-2 font-medium">Shipping Address</h3>
              <p className="text-muted-foreground text-sm">
                {shippingAddress.name}
                {shippingAddress.company && (
                  <>
                    <br />
                    {shippingAddress.company}
                  </>
                )}
                <br />
                {shippingAddress.line1}
                {shippingAddress.line2 && (
                  <>
                    <br />
                    {shippingAddress.line2}
                  </>
                )}
                <br />
                {shippingAddress.city}
                {shippingAddress.state && `, ${shippingAddress.state}`} {shippingAddress.postalCode}
                <br />
                {shippingAddress.country}
              </p>
            </div>

            {/* Shipping Method */}
            {order.shippingMethod && (
              <div>
                <h3 className="mb-2 font-medium">Shipping Method</h3>
                <p className="text-muted-foreground text-sm capitalize">
                  {order.shippingMethod.replace("_", " ")} Shipping
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardContent className="flex items-center gap-4 py-4">
            <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
              <Mail className="text-primary h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-medium">Confirmation Email</p>
              <p className="text-muted-foreground text-sm">
                We&apos;ve sent order details to {order.email}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Button asChild>
            <Link href="/products">
              Continue Shopping
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/account/orders">View Order History</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function LoadingConfirmation() {
  return (
    <div className="container flex min-h-[60vh] items-center justify-center py-12">
      <div className="text-center">
        <Loader2 className="text-muted-foreground mx-auto h-8 w-8 animate-spin" />
        <p className="text-muted-foreground mt-4">Loading order details...</p>
      </div>
    </div>
  );
}

function NoOrderNumber() {
  return (
    <div className="container py-12">
      <div className="mx-auto max-w-md text-center">
        <h1 className="text-2xl font-semibold">Order Not Found</h1>
        <p className="text-muted-foreground mt-2">
          We couldn&apos;t find an order with the provided number.
        </p>
        <Button className="mt-6" asChild>
          <Link href="/products">Continue Shopping</Link>
        </Button>
      </div>
    </div>
  );
}

export default async function ConfirmationPage({ searchParams }: ConfirmationPageProps) {
  const params = await searchParams;
  const orderNumber = params.order;

  if (!orderNumber) {
    return <NoOrderNumber />;
  }

  return (
    <Suspense fallback={<LoadingConfirmation />}>
      <OrderConfirmation orderNumber={orderNumber} />
    </Suspense>
  );
}
