import dynamic from "next/dynamic";
import { Footer } from "@/components/common";

// Dynamic import Header and CartDrawer to avoid SSR issues with zustand
const Header = dynamic(() => import("@/components/common/Header").then((mod) => mod.Header), {
  ssr: false,
});

const CartDrawer = dynamic(
  () => import("@/components/shop/CartDrawer").then((mod) => mod.CartDrawer),
  {
    ssr: false,
  }
);

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <CartDrawer />
    </div>
  );
}
