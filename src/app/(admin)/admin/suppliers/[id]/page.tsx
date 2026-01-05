"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Wifi,
  WifiOff,
  Loader2,
  CheckCircle2,
  XCircle,
  Package,
  ShoppingCart,
  ExternalLink,
  Mail,
  Phone,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  sku: string;
  supplierSku: string | null;
  price: string;
  supplierPrice: string | null;
  stock: number;
  isActive: boolean;
}

interface SupplierOrder {
  id: string;
  orderId: string;
  supplierOrderId: string | null;
  status: string;
  trackingNumber: string | null;
  cost: string | null;
  createdAt: string;
  order: { orderNumber: string };
}

interface Supplier {
  id: string;
  name: string;
  code: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  apiEndpoint: string | null;
  apiKey: string | null;
  apiType: string | null;
  isActive: boolean;
  notes: string | null;
  products: Product[];
  supplierOrders: SupplierOrder[];
  _count: { products: number; supplierOrders: number };
  createdAt: string;
  updatedAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  submitted: "bg-blue-100 text-blue-800",
  confirmed: "bg-purple-100 text-purple-800",
  shipped: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  failed: "bg-red-100 text-red-800",
};

export default function SupplierDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    const fetchSupplier = async () => {
      try {
        const response = await fetch(`/api/admin/suppliers/${id}`);
        if (!response.ok) {
          if (response.status === 404) {
            toast.error("Supplier not found");
            router.push("/admin/suppliers");
            return;
          }
          throw new Error("Failed to fetch supplier");
        }
        const data = await response.json();
        setSupplier(data);
      } catch (error) {
        console.error("Error fetching supplier:", error);
        toast.error("Failed to load supplier");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSupplier();
  }, [id, router]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/suppliers/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete supplier");
      }

      toast.success("Supplier deleted successfully");
      router.push("/admin/suppliers");
    } catch (error) {
      console.error("Error deleting supplier:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete supplier");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const testConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const response = await fetch(`/api/admin/suppliers/${id}/test-connection`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to test connection");
      }

      setTestResult({ success: data.success, message: data.message });

      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Error testing connection:", error);
      const message = error instanceof Error ? error.message : "Connection test failed";
      setTestResult({ success: false, message });
      toast.error(message);
    } finally {
      setIsTesting(false);
    }
  };

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(parseFloat(price));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-[200px]" />
          <Skeleton className="h-[200px]" />
        </div>
        <Skeleton className="h-[300px]" />
      </div>
    );
  }

  if (!supplier) {
    return null;
  }

  const canDelete = supplier._count.products === 0 && supplier._count.supplierOrders === 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/suppliers">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold tracking-tight">{supplier.name}</h2>
              <Badge variant={supplier.isActive ? "default" : "secondary"}>
                {supplier.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            <p className="text-muted-foreground">Code: {supplier.code}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/admin/suppliers?edit=${supplier.id}`)}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="destructive"
            onClick={() => setDeleteDialogOpen(true)}
            disabled={!canDelete}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Contact Info */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {supplier.email && (
              <div className="flex items-center gap-2">
                <Mail className="text-muted-foreground h-4 w-4" />
                <a href={`mailto:${supplier.email}`} className="text-sm hover:underline">
                  {supplier.email}
                </a>
              </div>
            )}
            {supplier.phone && (
              <div className="flex items-center gap-2">
                <Phone className="text-muted-foreground h-4 w-4" />
                <a href={`tel:${supplier.phone}`} className="text-sm hover:underline">
                  {supplier.phone}
                </a>
              </div>
            )}
            {supplier.website && (
              <div className="flex items-center gap-2">
                <Globe className="text-muted-foreground h-4 w-4" />
                <a
                  href={supplier.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm hover:underline"
                >
                  {new URL(supplier.website).hostname}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
            {!supplier.email && !supplier.phone && !supplier.website && (
              <p className="text-muted-foreground text-sm">No contact information available</p>
            )}
            {supplier.notes && (
              <div className="border-t pt-3">
                <p className="text-muted-foreground text-sm">{supplier.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* API Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              API Configuration
              {supplier.apiEndpoint ? (
                <Wifi className="h-4 w-4 text-blue-500" />
              ) : (
                <WifiOff className="text-muted-foreground h-4 w-4" />
              )}
            </CardTitle>
            <CardDescription>
              {supplier.apiEndpoint
                ? "This supplier has API integration configured"
                : "No API integration configured"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {supplier.apiEndpoint ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium">Endpoint</p>
                  <p className="text-muted-foreground font-mono text-sm break-all">
                    {supplier.apiEndpoint}
                  </p>
                </div>
                {supplier.apiType && (
                  <div>
                    <p className="text-sm font-medium">Authentication Type</p>
                    <p className="text-muted-foreground text-sm capitalize">{supplier.apiType}</p>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={testConnection} disabled={isTesting}>
                    {isTesting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <Wifi className="mr-2 h-4 w-4" />
                        Test Connection
                      </>
                    )}
                  </Button>
                  {testResult && (
                    <div className="flex items-center gap-1">
                      {testResult.success ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span
                        className={`text-sm ${
                          testResult.success ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {testResult.message}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                Configure an API endpoint to enable automatic order forwarding.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-blue-100 p-3">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{supplier._count.products}</p>
              <p className="text-muted-foreground text-sm">Products</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="rounded-full bg-green-100 p-3">
              <ShoppingCart className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{supplier._count.supplierOrders}</p>
              <p className="text-muted-foreground text-sm">Orders</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Products */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Products</CardTitle>
          <CardDescription>
            Products supplied by this supplier (showing most recent 10)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {supplier.products.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center text-sm">
              No products linked to this supplier
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Supplier SKU</TableHead>
                  <TableHead className="text-right">Our Price</TableHead>
                  <TableHead className="text-right">Supplier Price</TableHead>
                  <TableHead className="text-center">Stock</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {supplier.products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <Link
                        href={`/admin/products/${product.id}`}
                        className="font-medium hover:underline"
                      >
                        {product.name}
                      </Link>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {product.supplierSku || "-"}
                    </TableCell>
                    <TableCell className="text-right">{formatPrice(product.price)}</TableCell>
                    <TableCell className="text-right">
                      {product.supplierPrice ? formatPrice(product.supplierPrice) : "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={
                          product.stock > 10
                            ? "default"
                            : product.stock > 0
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {product.stock}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={product.isActive ? "default" : "outline"}>
                        {product.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recent Supplier Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>Orders sent to this supplier (showing most recent 10)</CardDescription>
        </CardHeader>
        <CardContent>
          {supplier.supplierOrders.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center text-sm">
              No orders sent to this supplier yet
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Supplier Order ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tracking</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {supplier.supplierOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <Link
                        href={`/admin/orders/${order.orderId}`}
                        className="font-medium hover:underline"
                      >
                        {order.order.orderNumber}
                      </Link>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {order.supplierOrderId || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[order.status] || "bg-gray-100 text-gray-800"}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {order.trackingNumber || <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      {order.cost ? formatPrice(order.cost) : "-"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(order.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Supplier</AlertDialogTitle>
            <AlertDialogDescription>
              {canDelete
                ? "Are you sure you want to delete this supplier? This action cannot be undone."
                : `Cannot delete this supplier because it has ${supplier._count.products} products and ${supplier._count.supplierOrders} orders linked to it.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            {canDelete && (
              <AlertDialogAction
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
