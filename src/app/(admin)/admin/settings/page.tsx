"use client";

import { useState } from "react";
import { Save, Store, Mail, CreditCard, Truck, Bell, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  // Store settings
  const [storeSettings, setStoreSettings] = useState({
    storeName: process.env.NEXT_PUBLIC_STORE_NAME || "Store",
    storeDescription: "Your one-stop shop for quality products",
    contactEmail: "support@store.com",
    supportPhone: "",
    address: "",
  });

  // Email settings
  const [emailSettings, setEmailSettings] = useState({
    orderConfirmation: true,
    shippingUpdates: true,
    marketingEmails: false,
    lowStockAlerts: true,
  });

  // Shipping settings
  const [shippingSettings, setShippingSettings] = useState({
    freeShippingThreshold: "50",
    defaultShippingRate: "5.99",
    expressShippingRate: "15.99",
  });

  const handleSaveGeneral = async () => {
    setIsSaving(true);
    try {
      // In a real app, this would save to the backend
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast({
        title: "Settings saved",
        description: "Store settings have been updated successfully.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveEmail = async () => {
    setIsSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast({
        title: "Settings saved",
        description: "Email notification settings have been updated.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveShipping = async () => {
    setIsSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast({
        title: "Settings saved",
        description: "Shipping settings have been updated.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your store configuration</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general" className="gap-2">
            <Store className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="email" className="gap-2">
            <Mail className="h-4 w-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="shipping" className="gap-2">
            <Truck className="h-4 w-4" />
            Shipping
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Payments
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Store Information</CardTitle>
              <CardDescription>Basic information about your store</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="storeName">Store Name</Label>
                  <Input
                    id="storeName"
                    value={storeSettings.storeName}
                    onChange={(e) =>
                      setStoreSettings((prev) => ({ ...prev, storeName: e.target.value }))
                    }
                    placeholder="My Store"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Contact Email</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={storeSettings.contactEmail}
                    onChange={(e) =>
                      setStoreSettings((prev) => ({ ...prev, contactEmail: e.target.value }))
                    }
                    placeholder="support@store.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="storeDescription">Store Description</Label>
                <Textarea
                  id="storeDescription"
                  value={storeSettings.storeDescription}
                  onChange={(e) =>
                    setStoreSettings((prev) => ({ ...prev, storeDescription: e.target.value }))
                  }
                  placeholder="Describe your store..."
                  rows={3}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="supportPhone">Support Phone (optional)</Label>
                  <Input
                    id="supportPhone"
                    value={storeSettings.supportPhone}
                    onChange={(e) =>
                      setStoreSettings((prev) => ({ ...prev, supportPhone: e.target.value }))
                    }
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Business Address (optional)</Label>
                  <Input
                    id="address"
                    value={storeSettings.address}
                    onChange={(e) =>
                      setStoreSettings((prev) => ({ ...prev, address: e.target.value }))
                    }
                    placeholder="123 Main St, City, Country"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleSaveGeneral} disabled={isSaving}>
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Email Settings */}
        <TabsContent value="email" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Email Notifications
              </CardTitle>
              <CardDescription>Configure which emails are sent automatically</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Order Confirmation</Label>
                  <p className="text-muted-foreground text-sm">
                    Send email when a new order is placed
                  </p>
                </div>
                <Switch
                  checked={emailSettings.orderConfirmation}
                  onCheckedChange={(checked) =>
                    setEmailSettings((prev) => ({ ...prev, orderConfirmation: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Shipping Updates</Label>
                  <p className="text-muted-foreground text-sm">
                    Notify customers when order status changes
                  </p>
                </div>
                <Switch
                  checked={emailSettings.shippingUpdates}
                  onCheckedChange={(checked) =>
                    setEmailSettings((prev) => ({ ...prev, shippingUpdates: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Marketing Emails</Label>
                  <p className="text-muted-foreground text-sm">
                    Send promotional emails to customers
                  </p>
                </div>
                <Switch
                  checked={emailSettings.marketingEmails}
                  onCheckedChange={(checked) =>
                    setEmailSettings((prev) => ({ ...prev, marketingEmails: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Low Stock Alerts</Label>
                  <p className="text-muted-foreground text-sm">
                    Get notified when products are running low
                  </p>
                </div>
                <Switch
                  checked={emailSettings.lowStockAlerts}
                  onCheckedChange={(checked) =>
                    setEmailSettings((prev) => ({ ...prev, lowStockAlerts: checked }))
                  }
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleSaveEmail} disabled={isSaving}>
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Shipping Settings */}
        <TabsContent value="shipping" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Shipping Rates</CardTitle>
              <CardDescription>Configure shipping costs and thresholds</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="freeShipping">Free Shipping Threshold ($)</Label>
                  <Input
                    id="freeShipping"
                    type="number"
                    min="0"
                    step="0.01"
                    value={shippingSettings.freeShippingThreshold}
                    onChange={(e) =>
                      setShippingSettings((prev) => ({
                        ...prev,
                        freeShippingThreshold: e.target.value,
                      }))
                    }
                  />
                  <p className="text-muted-foreground text-xs">
                    Orders above this amount get free shipping
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="standardRate">Standard Shipping ($)</Label>
                  <Input
                    id="standardRate"
                    type="number"
                    min="0"
                    step="0.01"
                    value={shippingSettings.defaultShippingRate}
                    onChange={(e) =>
                      setShippingSettings((prev) => ({
                        ...prev,
                        defaultShippingRate: e.target.value,
                      }))
                    }
                  />
                  <p className="text-muted-foreground text-xs">Default shipping rate</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expressRate">Express Shipping ($)</Label>
                  <Input
                    id="expressRate"
                    type="number"
                    min="0"
                    step="0.01"
                    value={shippingSettings.expressShippingRate}
                    onChange={(e) =>
                      setShippingSettings((prev) => ({
                        ...prev,
                        expressShippingRate: e.target.value,
                      }))
                    }
                  />
                  <p className="text-muted-foreground text-xs">Rate for express delivery</p>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={handleSaveShipping} disabled={isSaving}>
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Settings */}
        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Payment Configuration
              </CardTitle>
              <CardDescription>Manage payment provider settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#635BFF]">
                    <span className="text-sm font-bold text-white">S</span>
                  </div>
                  <div>
                    <p className="font-medium">Stripe</p>
                    <p className="text-muted-foreground text-sm">
                      {process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
                        ? "Connected"
                        : "Not configured"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="text-muted-foreground rounded-lg border border-dashed p-6 text-center">
                <CreditCard className="mx-auto h-8 w-8 opacity-50" />
                <p className="mt-2 text-sm">
                  Payment settings are configured through environment variables for security.
                </p>
                <p className="mt-1 text-xs">
                  Update STRIPE_SECRET_KEY and STRIPE_PUBLISHABLE_KEY in your .env file.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
