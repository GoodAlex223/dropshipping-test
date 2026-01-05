import { AdminSidebar } from "@/components/admin";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex flex-1 flex-col">
        <header className="bg-background flex h-16 items-center border-b px-6">
          <h1 className="text-lg font-semibold">Admin Panel</h1>
        </header>
        <main className="bg-muted/20 flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
