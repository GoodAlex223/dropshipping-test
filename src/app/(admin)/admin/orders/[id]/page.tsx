"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Package,
  ArrowLeft,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  CreditCard,
  MapPin,
  User,
  Mail,
  Loader2,
  Save,
  Send,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productSku: string;
  variantInfo?: string;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
  image: string | null;
  productSlug: string;
}

interface SupplierOrder {
  id: string;
  supplierOrderId?: string;
  status: string;
  trackingNumber?: string;
  trackingUrl?: string;
  cost?: string;
  sentAt?: string;
  supplier: {
    id: string;
    name: string;
    code: string;
  };
}

interface Order {
  id: string;
  orderNumber: string;
  email: string;
  phone?: string;
  status: string;
  paymentStatus: string;
  paymentMethod?: string;
  paymentIntent?: string;
  subtotal: string;
  shippingCost: string;
  discount: string;
  tax: string;
  total: string;
  shippingAddress: {
    name: string;
    company?: string;
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
    phone?: string;
  };
  shippingMethod?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  notes?: string;
  customerNotes?: string;
  createdAt: string;
  paidAt?: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  items: OrderItem[];
  supplierOrders: SupplierOrder[];
}

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "PROCESSING", label: "Processing" },
  { value: "SHIPPED", label: "Shipped" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "REFUNDED", label: "Refunded" },
];

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  PROCESSING: "bg-purple-100 text-purple-800",
  SHIPPED: "bg-indigo-100 text-indigo-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  REFUNDED: "bg-gray-100 text-gray-800",
};

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  PAID: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
  REFUNDED: "bg-gray-100 text-gray-800",
  PARTIALLY_REFUNDED: "bg-orange-100 text-orange-800",
};

const ORDER_TIMELINE = [
  { status: "PENDING", label: "Order Placed", icon: Clock },
  { status: "CONFIRMED", label: "Order Confirmed", icon: CheckCircle2 },
  { status: "PROCESSING", label: "Processing", icon: Package },
  { status: "SHIPPED", label: "Shipped", icon: Truck },
  { status: "DELIVERED", label: "Delivered", icon: CheckCircle2 },
];

interface AdminOrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function AdminOrderDetailPage({ params }: AdminOrderDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isForwarding, setIsForwarding] = useState(false);

  // Update form state
  const [newStatus, setNewStatus] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [updateNotes, setUpdateNotes] = useState("");

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await fetch(`/api/admin/orders/${id}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError("Order not found");
          } else {
            setError("Failed to load order");
          }
          return;
        }
        const data = await response.json();
        setOrder(data);
        setNewStatus(data.status);
        setTrackingNumber(data.trackingNumber || "");
        setTrackingUrl(data.trackingUrl || "");
      } catch (err) {
        setError("Failed to load order");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  const handleUpdateStatus = async () => {
    if (!order) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/admin/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          trackingNumber: trackingNumber || undefined,
          trackingUrl: trackingUrl || undefined,
          notes: updateNotes || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update order");
      }

      const updatedOrder = await response.json();
      setOrder({
        ...order,
        status: updatedOrder.status,
        trackingNumber: updatedOrder.trackingNumber,
        trackingUrl: updatedOrder.trackingUrl,
        notes: updatedOrder.notes,
      });
      setIsDialogOpen(false);
      setUpdateNotes("");
      toast.success("Order updated successfully");
    } catch (err) {
      toast.error("Failed to update order");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleForwardToSuppliers = async () => {
    if (!order) return;

    setIsForwarding(true);
    try {
      const response = await fetch(`/api/admin/orders/${id}/forward`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to forward order");
      }

      toast.success(data.message);

      // Refresh order data
      const refreshResponse = await fetch(`/api/admin/orders/${id}`);
      if (refreshResponse.ok) {
        const refreshedOrder = await refreshResponse.json();
        setOrder(refreshedOrder);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to forward order");
    } finally {
      setIsForwarding(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusIndex = (status: string) => {
    if (status === "CANCELLED" || status === "REFUNDED") return -1;
    return ORDER_TIMELINE.findIndex((s) => s.status === status);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <Skeleton className="h-48" />
            <Skeleton className="h-64" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Package className="text-muted-foreground h-16 w-16" />
        <h2 className="mt-4 text-lg font-medium">{error || "Order not found"}</h2>
        <Button className="mt-6" onClick={() => router.push("/admin/orders")}>
          Back to Orders
        </Button>
      </div>
    );
  }

  const currentStatusIndex = getStatusIndex(order.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/orders">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Order {order.orderNumber}</h1>
            <p className="text-muted-foreground text-sm">Placed on {formatDate(order.createdAt)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className={`${STATUS_COLORS[order.status]} text-sm`}>
            {order.status}
          </Badge>
          <Badge
            variant="secondary"
            className={`${PAYMENT_STATUS_COLORS[order.paymentStatus]} text-sm`}
          >
            {order.paymentStatus}
          </Badge>
          {order.paymentStatus === "PAID" &&
            !["CANCELLED", "REFUNDED", "DELIVERED"].includes(order.status) && (
              <Button variant="outline" onClick={handleForwardToSuppliers} disabled={isForwarding}>
                {isForwarding ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Forwarding...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Forward to Suppliers
                  </>
                )}
              </Button>
            )}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>Update Status</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Update Order Status</DialogTitle>
                <DialogDescription>
                  Change the order status and add tracking information.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {(newStatus === "SHIPPED" || order.status === "SHIPPED") && (
                  <>
                    <div className="space-y-2">
                      <Label>Tracking Number</Label>
                      <Input
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        placeholder="Enter tracking number"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tracking URL</Label>
                      <Input
                        value={trackingUrl}
                        onChange={(e) => setTrackingUrl(e.target.value)}
                        placeholder="https://..."
                      />
                    </div>
                  </>
                )}
                <div className="space-y-2">
                  <Label>Notes (optional)</Label>
                  <Textarea
                    value={updateNotes}
                    onChange={(e) => setUpdateNotes(e.target.value)}
                    placeholder="Add internal notes about this update..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isUpdating}
                >
                  Cancel
                </Button>
                <Button onClick={handleUpdateStatus} disabled={isUpdating}>
                  {isUpdating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Order Status Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Order Status</CardTitle>
            </CardHeader>
            <CardContent>
              {order.status === "CANCELLED" || order.status === "REFUNDED" ? (
                <div className="flex items-center gap-4 text-red-600">
                  <XCircle className="h-8 w-8" />
                  <div>
                    <p className="font-medium">Order {order.status.toLowerCase()}</p>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  {ORDER_TIMELINE.map((step, index) => {
                    const isCompleted = index <= currentStatusIndex;
                    const isCurrent = index === currentStatusIndex;
                    const Icon = step.icon;

                    return (
                      <div key={step.status} className="flex gap-4 pb-8 last:pb-0">
                        <div className="relative flex flex-col items-center">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                              isCompleted
                                ? "border-green-500 bg-green-500 text-white"
                                : "border-muted-foreground/30 bg-background text-muted-foreground"
                            }`}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          {index < ORDER_TIMELINE.length - 1 && (
                            <div
                              className={`absolute top-10 h-full w-0.5 ${
                                index < currentStatusIndex
                                  ? "bg-green-500"
                                  : "bg-muted-foreground/30"
                              }`}
                            />
                          )}
                        </div>
                        <div className="flex-1 pt-2">
                          <p
                            className={`font-medium ${isCompleted ? "" : "text-muted-foreground"}`}
                          >
                            {step.label}
                          </p>
                          {isCurrent && order.status === "SHIPPED" && order.trackingNumber && (
                            <div className="mt-2">
                              <p className="text-muted-foreground text-sm">
                                Tracking: {order.trackingNumber}
                              </p>
                              {order.trackingUrl && (
                                <a
                                  href={order.trackingUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary text-sm hover:underline"
                                >
                                  Track Package
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Items ({order.items.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex gap-4 border-b pb-4 last:border-0 last:pb-0">
                  <Link href={`/admin/products/${item.productId}`}>
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.productName}
                        className="h-20 w-20 rounded-md object-cover"
                      />
                    ) : (
                      <div className="bg-muted flex h-20 w-20 items-center justify-center rounded-md">
                        <Package className="text-muted-foreground h-8 w-8" />
                      </div>
                    )}
                  </Link>
                  <div className="flex-1">
                    <Link
                      href={`/admin/products/${item.productId}`}
                      className="font-medium hover:underline"
                    >
                      {item.productName}
                    </Link>
                    {item.variantInfo && (
                      <p className="text-muted-foreground text-sm">{item.variantInfo}</p>
                    )}
                    <p className="text-muted-foreground text-sm">SKU: {item.productSku}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-sm">
                        ${parseFloat(item.unitPrice).toFixed(2)} × {item.quantity}
                      </p>
                      <p className="font-medium">${parseFloat(item.totalPrice).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Internal Notes */}
          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Internal Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{order.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Customer Notes */}
          {order.customerNotes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Customer Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">{order.customerNotes}</p>
              </CardContent>
            </Card>
          )}

          {/* Supplier Orders */}
          {order.supplierOrders.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Truck className="h-4 w-4" />
                  Supplier Orders ({order.supplierOrders.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {order.supplierOrders.map((so) => (
                  <div
                    key={so.id}
                    className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/suppliers/${so.supplier.id}`}
                          className="font-medium hover:underline"
                        >
                          {so.supplier.name}
                        </Link>
                        <Badge variant="outline" className="text-xs">
                          {so.supplier.code}
                        </Badge>
                      </div>
                      {so.supplierOrderId && (
                        <p className="text-muted-foreground mt-1 text-sm">
                          Supplier Order: {so.supplierOrderId}
                        </p>
                      )}
                      {so.trackingNumber && (
                        <div className="mt-1 flex items-center gap-2">
                          <p className="text-muted-foreground text-sm">
                            Tracking: {so.trackingNumber}
                          </p>
                          {so.trackingUrl && (
                            <a
                              href={so.trackingUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:underline"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </div>
                      )}
                      {so.cost && (
                        <p className="text-muted-foreground mt-1 text-sm">
                          Cost: ${parseFloat(so.cost).toFixed(2)}
                        </p>
                      )}
                    </div>
                    <Badge
                      variant="secondary"
                      className={
                        so.status === "delivered"
                          ? "bg-green-100 text-green-800"
                          : so.status === "shipped"
                            ? "bg-blue-100 text-blue-800"
                            : so.status === "failed"
                              ? "bg-red-100 text-red-800"
                              : so.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800"
                      }
                    >
                      {so.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${parseFloat(order.subtotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span>${parseFloat(order.shippingCost).toFixed(2)}</span>
              </div>
              {parseFloat(order.discount) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="text-green-600">-${parseFloat(order.discount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax</span>
                <span>${parseFloat(order.tax).toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>${parseFloat(order.total).toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4" />
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-medium">{order.user?.name || order.shippingAddress.name}</p>
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  <Mail className="h-3 w-3" />
                  {order.email}
                </div>
                {order.phone && <p className="text-muted-foreground text-sm">{order.phone}</p>}
              </div>
              {order.user && (
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link href={`/admin/customers/${order.user.id}`}>View Customer</Link>
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="h-4 w-4" />
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <p className="font-medium">{order.shippingAddress.name}</p>
              {order.shippingAddress.company && <p>{order.shippingAddress.company}</p>}
              <p>{order.shippingAddress.line1}</p>
              {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
              <p>
                {order.shippingAddress.city}
                {order.shippingAddress.state && `, ${order.shippingAddress.state}`}{" "}
                {order.shippingAddress.postalCode}
              </p>
              <p>{order.shippingAddress.country}</p>
              {order.shippingAddress.phone && <p className="mt-2">{order.shippingAddress.phone}</p>}
            </CardContent>
          </Card>

          {/* Payment Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="h-4 w-4" />
                Payment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Method</span>
                <span className="capitalize">{order.paymentMethod || "Card"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge
                  variant="secondary"
                  className={`${PAYMENT_STATUS_COLORS[order.paymentStatus]} text-xs`}
                >
                  {order.paymentStatus}
                </Badge>
              </div>
              {order.paidAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Paid on</span>
                  <span>{formatDate(order.paidAt)}</span>
                </div>
              )}
              {order.paymentIntent && (
                <div className="pt-2">
                  <p className="text-muted-foreground text-xs">
                    Payment Intent: {order.paymentIntent}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
