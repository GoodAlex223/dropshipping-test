"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  Truck,
  ChevronLeft,
  ChevronRight,
  Wifi,
  WifiOff,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

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
  _count: { products: number; supplierOrders: number };
  createdAt: string;
}

interface PaginatedResponse {
  data: Supplier[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

interface SupplierFormData {
  name: string;
  code: string;
  email: string;
  phone: string;
  website: string;
  apiEndpoint: string;
  apiKey: string;
  apiType: string;
  isActive: boolean;
  notes: string;
}

const initialFormData: SupplierFormData = {
  name: "",
  code: "",
  email: "",
  phone: "",
  website: "",
  apiEndpoint: "",
  apiKey: "",
  apiType: "",
  isActive: true,
  notes: "",
};

function SuppliersContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState<SupplierFormData>(initialFormData);
  const [isSaving, setIsSaving] = useState(false);

  // Connection test state
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<
    Record<string, { success: boolean; message: string }>
  >({});

  // Filters
  const [search, setSearch] = useState(searchParams?.get("search") || "");
  const [statusFilter, setStatusFilter] = useState(searchParams?.get("isActive") || "all");
  const [apiFilter, setApiFilter] = useState(searchParams?.get("hasApi") || "all");

  const fetchSuppliers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", searchParams?.get("page") || "1");
      params.set("limit", "20");
      if (search) params.set("search", search);
      if (statusFilter !== "all") params.set("isActive", statusFilter);
      if (apiFilter !== "all") params.set("hasApi", apiFilter);

      const response = await fetch(`/api/admin/suppliers?${params}`);
      if (!response.ok) throw new Error("Failed to fetch suppliers");

      const data: PaginatedResponse = await response.json();
      setSuppliers(data.data);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      toast.error("Failed to load suppliers");
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, apiFilter, searchParams]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.set("page", "1");
    if (search) params.set("search", search);
    else params.delete("search");
    router.push(`/admin/suppliers?${params}`);
  };

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.set("page", "1");
    if (value && value !== "all") params.set(key, value);
    else params.delete(key);
    router.push(`/admin/suppliers?${params}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.set("page", newPage.toString());
    router.push(`/admin/suppliers?${params}`);
  };

  const openCreateDialog = () => {
    setEditingSupplier(null);
    setFormData(initialFormData);
    setDialogOpen(true);
  };

  const openEditDialog = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      code: supplier.code,
      email: supplier.email || "",
      phone: supplier.phone || "",
      website: supplier.website || "",
      apiEndpoint: supplier.apiEndpoint || "",
      apiKey: "", // Don't show existing API key
      apiType: supplier.apiType || "",
      isActive: supplier.isActive,
      notes: supplier.notes || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.code) {
      toast.error("Name and code are required");
      return;
    }

    setIsSaving(true);
    try {
      const url = editingSupplier
        ? `/api/admin/suppliers/${editingSupplier.id}`
        : "/api/admin/suppliers";

      const body = {
        ...formData,
        email: formData.email || null,
        phone: formData.phone || null,
        website: formData.website || null,
        apiEndpoint: formData.apiEndpoint || null,
        apiKey: formData.apiKey || (editingSupplier ? undefined : null),
        apiType: formData.apiType || null,
        notes: formData.notes || null,
      };

      // If editing and apiKey is empty, remove it to preserve existing key
      if (editingSupplier && !formData.apiKey) {
        delete body.apiKey;
      }

      const response = await fetch(url, {
        method: editingSupplier ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save supplier");
      }

      toast.success(
        editingSupplier ? "Supplier updated successfully" : "Supplier created successfully"
      );
      setDialogOpen(false);
      fetchSuppliers();
    } catch (error) {
      console.error("Error saving supplier:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save supplier");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/suppliers/${deleteId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete supplier");
      }

      toast.success("Supplier deleted successfully");
      fetchSuppliers();
    } catch (error) {
      console.error("Error deleting supplier:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete supplier");
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const testConnection = async (supplierId: string) => {
    setTestingId(supplierId);
    try {
      const response = await fetch(`/api/admin/suppliers/${supplierId}/test-connection`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to test connection");
      }

      setTestResults((prev) => ({
        ...prev,
        [supplierId]: { success: data.success, message: data.message },
      }));

      if (data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Error testing connection:", error);
      const message = error instanceof Error ? error.message : "Connection test failed";
      setTestResults((prev) => ({
        ...prev,
        [supplierId]: { success: false, message },
      }));
      toast.error(message);
    } finally {
      setTestingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Suppliers</h2>
          <p className="text-muted-foreground">
            Manage your product suppliers ({pagination.total} suppliers)
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add Supplier
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <form onSubmit={handleSearch} className="flex flex-1 gap-2">
          <div className="relative flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Search suppliers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>

        <div className="flex gap-2">
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value);
              handleFilterChange("isActive", value);
            }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="true">Active</SelectItem>
              <SelectItem value="false">Inactive</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={apiFilter}
            onValueChange={(value) => {
              setApiFilter(value);
              handleFilterChange("hasApi", value);
            }}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="API Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="true">With API</SelectItem>
              <SelectItem value="false">Without API</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Supplier</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead className="text-center">Products</TableHead>
              <TableHead className="text-center">Orders</TableHead>
              <TableHead className="text-center">API</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : suppliers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Truck className="text-muted-foreground h-8 w-8" />
                    <p className="text-muted-foreground">No suppliers found</p>
                    <Button size="sm" onClick={openCreateDialog}>
                      Add your first supplier
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              suppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{supplier.name}</p>
                      {supplier.website && (
                        <a
                          href={supplier.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground text-sm hover:underline"
                        >
                          {new URL(supplier.website).hostname}
                        </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{supplier.code}</TableCell>
                  <TableCell>
                    <div className="space-y-1 text-sm">
                      {supplier.email && <p className="text-muted-foreground">{supplier.email}</p>}
                      {supplier.phone && <p className="text-muted-foreground">{supplier.phone}</p>}
                      {!supplier.email && !supplier.phone && (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{supplier._count.products}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{supplier._count.supplierOrders}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {supplier.apiEndpoint ? (
                      <div className="flex items-center justify-center gap-1">
                        {testingId === supplier.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : testResults[supplier.id] ? (
                          testResults[supplier.id].success ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )
                        ) : (
                          <Wifi className="h-4 w-4 text-blue-500" />
                        )}
                        <span className="text-sm">{supplier.apiType || "API"}</span>
                      </div>
                    ) : (
                      <WifiOff className="text-muted-foreground mx-auto h-4 w-4" />
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={supplier.isActive ? "default" : "outline"}>
                      {supplier.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => router.push(`/admin/suppliers/${supplier.id}`)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEditDialog(supplier)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        {supplier.apiEndpoint && (
                          <DropdownMenuItem
                            onClick={() => testConnection(supplier.id)}
                            disabled={testingId === supplier.id}
                          >
                            <Wifi className="mr-2 h-4 w-4" />
                            Test Connection
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteId(supplier.id)}
                          disabled={
                            supplier._count.products > 0 || supplier._count.supplierOrders > 0
                          }
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}{" "}
            suppliers
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={!pagination.hasPrev}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={!pagination.hasNext}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSupplier ? "Edit Supplier" : "Create Supplier"}</DialogTitle>
            <DialogDescription>
              {editingSupplier
                ? "Update the supplier information below."
                : "Add a new supplier to manage product sourcing."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Supplier name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      code: e.target.value.toUpperCase(),
                    })
                  }
                  placeholder="SUP001"
                  className="uppercase"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contact@supplier.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 234 567 8900"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://supplier.com"
              />
            </div>

            <div className="border-t pt-4">
              <h4 className="mb-3 font-medium">API Configuration</h4>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="apiEndpoint">API Endpoint</Label>
                  <Input
                    id="apiEndpoint"
                    value={formData.apiEndpoint}
                    onChange={(e) => setFormData({ ...formData, apiEndpoint: e.target.value })}
                    placeholder="https://api.supplier.com/v1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="apiKey">
                      API Key{" "}
                      {editingSupplier && (
                        <span className="text-muted-foreground">
                          (leave empty to keep existing)
                        </span>
                      )}
                    </Label>
                    <Input
                      id="apiKey"
                      type="password"
                      value={formData.apiKey}
                      onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                      placeholder="••••••••"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="apiType">API Type</Label>
                    <Select
                      value={formData.apiType}
                      onValueChange={(value) => setFormData({ ...formData, apiType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bearer">Bearer Token</SelectItem>
                        <SelectItem value="api-key">API Key Header</SelectItem>
                        <SelectItem value="basic">Basic Auth</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes about this supplier..."
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : editingSupplier ? (
                "Update Supplier"
              ) : (
                "Create Supplier"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Supplier</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this supplier? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function SuppliersLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="bg-muted h-8 w-32 rounded" />
          <div className="bg-muted mt-2 h-4 w-48 rounded" />
        </div>
        <div className="bg-muted h-10 w-32 rounded" />
      </div>
      <div className="flex gap-4">
        <div className="bg-muted h-10 flex-1 rounded" />
        <div className="bg-muted h-10 w-[140px] rounded" />
        <div className="bg-muted h-10 w-[160px] rounded" />
      </div>
      <div className="rounded-md border">
        <div className="bg-muted/20 h-[400px]" />
      </div>
    </div>
  );
}

export default function AdminSuppliersPage() {
  return (
    <Suspense fallback={<SuppliersLoadingSkeleton />}>
      <SuppliersContent />
    </Suspense>
  );
}
