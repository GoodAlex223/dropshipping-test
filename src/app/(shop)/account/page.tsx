"use client";
export const dynamic = "force-dynamic";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { Package, MapPin, Settings, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function AccountPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="space-y-6">
        <Skeleton className="h-24 w-full" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <Card>
        <CardContent className="py-6">
          <h2 className="text-xl font-semibold">
            Welcome back, {session?.user?.name || "Customer"}!
          </h2>
          <p className="text-muted-foreground mt-1">
            Manage your orders, addresses, and account settings.
          </p>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="transition-shadow hover:shadow-md">
          <CardHeader className="flex flex-row items-center gap-4 pb-2">
            <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
              <Package className="text-primary h-5 w-5" />
            </div>
            <CardTitle className="text-base">Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4 text-sm">View and track your orders</p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/account/orders">
                View Orders
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="transition-shadow hover:shadow-md">
          <CardHeader className="flex flex-row items-center gap-4 pb-2">
            <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
              <MapPin className="text-primary h-5 w-5" />
            </div>
            <CardTitle className="text-base">Addresses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4 text-sm">Manage your shipping addresses</p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/account/addresses">
                Manage Addresses
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="transition-shadow hover:shadow-md">
          <CardHeader className="flex flex-row items-center gap-4 pb-2">
            <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-lg">
              <Settings className="text-primary h-5 w-5" />
            </div>
            <CardTitle className="text-base">Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4 text-sm">Update your account settings</p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/account/settings">
                Account Settings
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-muted-foreground text-sm font-medium">Name</p>
              <p>{session?.user?.name || "Not set"}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-sm font-medium">Email</p>
              <p>{session?.user?.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
