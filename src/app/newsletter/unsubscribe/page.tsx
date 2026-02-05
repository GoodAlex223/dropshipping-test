"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const email = searchParams?.get("email") ?? null;
  const token = searchParams?.get("token") ?? null;

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleUnsubscribe() {
    if (!email || !token) {
      setStatus("error");
      setMessage("Invalid unsubscribe link.");
      return;
    }

    setStatus("loading");
    try {
      const response = await fetch("/api/newsletter/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus("success");
        setMessage(data.message || "You have been unsubscribed.");
      } else {
        setStatus("error");
        setMessage(data.error || "Failed to unsubscribe.");
      }
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again later.");
    }
  }

  if (!email || !token) {
    return (
      <div className="container flex min-h-[60vh] items-center justify-center py-12">
        <div className="w-full max-w-md space-y-6 text-center">
          <XCircle className="mx-auto h-12 w-12 text-red-600" />
          <h1 className="text-2xl font-bold">Invalid Link</h1>
          <p className="text-muted-foreground">This unsubscribe link is invalid or incomplete.</p>
          <Button asChild variant="outline">
            <Link href="/">Go to Homepage</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container flex min-h-[60vh] items-center justify-center py-12">
      <div className="w-full max-w-md space-y-6 text-center">
        {status === "idle" && (
          <>
            <Mail className="text-muted-foreground mx-auto h-12 w-12" />
            <h1 className="text-2xl font-bold">Unsubscribe</h1>
            <p className="text-muted-foreground">
              Are you sure you want to unsubscribe <strong>{email}</strong> from our newsletter?
            </p>
            <Button onClick={handleUnsubscribe} variant="destructive">
              Yes, Unsubscribe
            </Button>
          </>
        )}

        {status === "loading" && (
          <>
            <Loader2 className="text-muted-foreground mx-auto h-12 w-12 animate-spin" />
            <h1 className="text-2xl font-bold">Processing...</h1>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
            <h1 className="text-2xl font-bold">Unsubscribed</h1>
            <p className="text-muted-foreground">{message}</p>
            <Button asChild variant="outline">
              <Link href="/">Go to Homepage</Link>
            </Button>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="mx-auto h-12 w-12 text-red-600" />
            <h1 className="text-2xl font-bold">Something Went Wrong</h1>
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

export default function NewsletterUnsubscribePage() {
  return (
    <Suspense
      fallback={
        <div className="container flex min-h-[60vh] items-center justify-center py-12">
          <Loader2 className="text-muted-foreground h-12 w-12 animate-spin" />
        </div>
      }
    >
      <UnsubscribeContent />
    </Suspense>
  );
}
