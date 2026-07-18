export const dynamic = "force-dynamic";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="mt-4 text-lg text-gray-600">Page not found</p>
      <Link
        href="/"
        className="bg-primary text-primary-foreground hover:bg-primary/90 mt-6 inline-block rounded-md px-4 py-2 transition-colors"
      >
        Go back home
      </Link>
    </div>
  );
}
