"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  ShoppingCart,
  Menu,
  Search,
  User,
  LogOut,
  Settings,
  X,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useCartStore } from "@/stores/cart.store";
import { useDebounce } from "@/hooks/use-debounce";

interface SearchResult {
  id: string;
  name: string;
  slug: string;
  price: string;
  image?: string;
  category: { name: string };
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

const navigation = [
  { name: "Home", href: "/" },
  { name: "Products", href: "/products" },
];

export function Header() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { getTotalItems, openCart } = useCartStore();
  const totalItems = getTotalItems();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  const debouncedQuery = useDebounce(searchQuery, 300);

  // Fetch categories for navigation
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/categories?parentOnly=true");
        if (response.ok) {
          const data = await response.json();
          setCategories(data.slice(0, 8)); // Limit to 8 categories
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  const isLoading = status === "loading";
  const isAuthenticated = status === "authenticated";
  const isAdmin = session?.user?.role === "ADMIN";

  // Search products when debounced query changes
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const searchProducts = async () => {
      setIsSearching(true);
      try {
        const response = await fetch(
          `/api/products?search=${encodeURIComponent(debouncedQuery)}&limit=5`
        );
        if (response.ok) {
          const data = await response.json();
          setSearchResults(
            data.data.map(
              (p: {
                id: string;
                name: string;
                slug: string;
                price: string;
                images: { url: string }[];
                category: { name: string };
              }) => ({
                id: p.id,
                name: p.name,
                slug: p.slug,
                price: p.price,
                image: p.images[0]?.url,
                category: p.category,
              })
            )
          );
        }
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsSearching(false);
      }
    };

    searchProducts();
  }, [debouncedQuery]);

  // Handle keyboard shortcut to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  const handleResultClick = (slug: string) => {
    router.push(`/products/${slug}`);
    setSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
    setMobileMenuOpen(false);
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        {/* Mobile menu */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] sm:w-[350px]">
            <SheetHeader className="text-left">
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>

            <nav className="mt-6 flex flex-col gap-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={closeMobileMenu}
                  className="hover:bg-muted flex items-center rounded-lg px-3 py-2 text-lg font-medium transition-colors"
                >
                  {item.name}
                </Link>
              ))}
              <Link
                href="/categories"
                onClick={closeMobileMenu}
                className="hover:bg-muted flex items-center rounded-lg px-3 py-2 text-lg font-medium transition-colors"
              >
                Categories
              </Link>
              {categories.length > 0 && (
                <div className="ml-4 flex flex-col gap-1">
                  {categories.slice(0, 5).map((category) => (
                    <Link
                      key={category.id}
                      href={`/categories/${category.slug}`}
                      onClick={closeMobileMenu}
                      className="text-muted-foreground hover:bg-muted hover:text-foreground flex items-center rounded-lg px-3 py-1.5 text-sm transition-colors"
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              )}
              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={closeMobileMenu}
                  className="text-primary hover:bg-muted flex items-center rounded-lg px-3 py-2 text-lg font-medium transition-colors"
                >
                  <Settings className="mr-2 h-5 w-5" />
                  Admin Panel
                </Link>
              )}
            </nav>

            <Separator className="my-4" />

            {/* Mobile user section */}
            {isAuthenticated ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3 px-3 py-2">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={session.user?.image || undefined} />
                    <AvatarFallback>{getInitials(session.user?.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-medium">{session.user?.name}</span>
                    <span className="text-muted-foreground text-sm">{session.user?.email}</span>
                  </div>
                </div>
                <Link
                  href="/account"
                  onClick={closeMobileMenu}
                  className="hover:bg-muted flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors"
                >
                  <User className="mr-2 h-4 w-4" />
                  Account
                </Link>
                <Link
                  href="/account/orders"
                  onClick={closeMobileMenu}
                  className="hover:bg-muted flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors"
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Orders
                </Link>
                <button
                  onClick={handleSignOut}
                  className="hover:bg-muted flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-colors"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </button>
              </div>
            ) : (
              <div className="space-y-2 px-3">
                <Link href="/login" onClick={closeMobileMenu}>
                  <Button className="w-full">Sign in</Button>
                </Link>
                <Link href="/register" onClick={closeMobileMenu}>
                  <Button variant="outline" className="w-full">
                    Create account
                  </Button>
                </Link>
              </div>
            )}
          </SheetContent>
        </Sheet>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold">Store</span>
        </Link>

        {/* Desktop navigation */}
        <nav className="hidden items-center gap-6 md:flex">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="hover:text-primary text-sm font-medium transition-colors"
            >
              {item.name}
            </Link>
          ))}

          {/* Categories Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="hover:text-primary flex items-center gap-1 text-sm font-medium transition-colors outline-none">
              Categories
              <ChevronDown className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-48">
              {categories.map((category) => (
                <DropdownMenuItem key={category.id} asChild>
                  <Link href={`/categories/${category.slug}`} className="cursor-pointer">
                    {category.name}
                  </Link>
                </DropdownMenuItem>
              ))}
              {categories.length > 0 && <DropdownMenuSeparator />}
              <DropdownMenuItem asChild>
                <Link href="/categories" className="cursor-pointer font-medium">
                  View All Categories
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {isAdmin && (
            <Link
              href="/admin"
              className="text-primary hover:text-primary/80 text-sm font-medium transition-colors"
            >
              Admin Panel
            </Link>
          )}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Search Button */}
          <Button variant="ghost" size="icon" onClick={() => setSearchOpen(true)}>
            <Search className="h-5 w-5" />
            <span className="sr-only">Search (Ctrl+K)</span>
          </Button>

          {/* Search Dialog */}
          <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
            <DialogContent className="p-0 sm:max-w-[500px]">
              <DialogHeader className="sr-only">
                <DialogTitle>Search Products</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSearchSubmit}>
                <div className="flex items-center border-b px-3">
                  <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                  <Input
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="placeholder:text-muted-foreground flex h-12 w-full border-0 bg-transparent py-3 text-sm outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                    autoFocus
                  />
                  {isSearching && <Loader2 className="h-4 w-4 animate-spin opacity-50" />}
                </div>
              </form>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="max-h-[300px] overflow-y-auto p-2">
                  {searchResults.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => handleResultClick(result.slug)}
                      className="hover:bg-muted flex w-full items-center gap-3 rounded-md p-2 text-left"
                    >
                      {result.image ? (
                        <img
                          src={result.image}
                          alt={result.name}
                          className="h-12 w-12 rounded-md object-cover"
                        />
                      ) : (
                        <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-md">
                          <Search className="text-muted-foreground h-4 w-4" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{result.name}</p>
                        <p className="text-muted-foreground text-sm">
                          {result.category.name} · ${parseFloat(result.price).toFixed(2)}
                        </p>
                      </div>
                    </button>
                  ))}
                  <Separator className="my-2" />
                  <button
                    onClick={handleSearchSubmit}
                    className="text-muted-foreground hover:bg-muted flex w-full items-center gap-2 rounded-md p-2 text-sm"
                  >
                    <Search className="h-4 w-4" />
                    View all results for &quot;{searchQuery}&quot;
                  </button>
                </div>
              )}

              {/* No Results */}
              {searchQuery.length >= 2 && !isSearching && searchResults.length === 0 && (
                <div className="text-muted-foreground p-4 text-center text-sm">
                  No products found for &quot;{searchQuery}&quot;
                </div>
              )}

              {/* Empty State */}
              {searchQuery.length < 2 && (
                <div className="text-muted-foreground p-4 text-center text-sm">
                  Type at least 2 characters to search...
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* User menu */}
          {isLoading ? (
            <Button variant="ghost" size="icon" disabled>
              <User className="h-5 w-5" />
            </Button>
          ) : isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={session.user?.image || undefined} />
                    <AvatarFallback>{getInitials(session.user?.name)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    {session.user?.name && <p className="font-medium">{session.user.name}</p>}
                    {session.user?.email && (
                      <p className="text-muted-foreground w-[200px] truncate text-sm">
                        {session.user.email}
                      </p>
                    )}
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/account" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Account
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/account/orders" className="cursor-pointer">
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Orders
                  </Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        Admin Panel
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
            </Link>
          )}

          <Button variant="ghost" size="icon" className="relative" onClick={openCart}>
            <ShoppingCart className="h-5 w-5" />
            {totalItems > 0 && (
              <span className="bg-primary text-primary-foreground absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-xs">
                {totalItems > 99 ? "99+" : totalItems}
              </span>
            )}
            <span className="sr-only">Cart</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
