"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

function ConfirmContent() {
  const searchParams = useSearchParams();
  const token = searchParams?.get("token") ?? null;

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    token ? "loading" : "error"
  );
  const [message, setMessage] = useState(
    token ? "" : "Invalid confirmation link. No token provided."
  );

  useEffect(() => {
    if (!token) return;

    async function confirmSubscription() {
      try {
        const response = await fetch(`/api/newsletter/confirm?token=${token}`);
        const data = await response.json();

        if (response.ok) {
          setStatus("success");
          setMessage(data.message || "Your subscription has been confirmed!");
        } else {
          setStatus("error");
          setMessage(data.error || "Failed to confirm subscription.");
        }
      } catch {
        setStatus("error");
        setMessage("Something went wrong. Please try again later.");
      }
    }

    confirmSubscription();
  }, [token]);

  return (
    <div className="container flex min-h-[60vh] items-center justify-center py-12">
      <div className="w-full max-w-md space-y-6 text-center">
        {status === "loading" && (
          <>
            <Loader2 className="text-muted-foreground mx-auto h-12 w-12 animate-spin" />
            <h1 className="text-2xl font-bold">Confirming your subscription...</h1>
            <p className="text-muted-foreground">Please wait a moment.</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
            <h1 className="text-2xl font-bold">You&apos;re subscribed!</h1>
            <p className="text-muted-foreground">{message}</p>
            <Button asChild>
              <Link href="/">Continue Shopping</Link>
            </Button>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="mx-auto h-12 w-12 text-red-600" />
            <h1 className="text-2xl font-bold">Confirmation Failed</h1>
            <p className="text-muted-foreground">{message}</p>
            <Button asChild variant="outline">
              <Link href="/">Go to Homepage</Link>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

export default function NewsletterConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="container flex min-h-[60vh] items-center justify-center py-12">
          <Loader2 className="text-muted-foreground h-12 w-12 animate-spin" />
        </div>
      }
    >
      <ConfirmContent />
    </Suspense>
  );
}
