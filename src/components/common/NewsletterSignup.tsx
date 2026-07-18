"use client";

import { useState, FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Subscription failed");
      }

      setIsSuccess(true);
      setEmail("");
      toast.success("Check your email to confirm your subscription");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to subscribe");
    } finally {
      setIsLoading(false);
    }
  }

  if (isSuccess) {
    return (
      <div className="border-border bg-muted flex items-start gap-2 rounded-md border p-3">
        <CheckCircle2 className="text-foreground h-5 w-5 flex-shrink-0" />
        <p className="text-foreground text-sm">Check your email to confirm your subscription!</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={isLoading}
        required
        className="bg-background"
      />
      <Button type="submit" disabled={isLoading} className="w-full" size="sm">
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isLoading ? "Subscribing..." : "Subscribe"}
      </Button>
      <p className="text-muted-foreground text-xs">
        We respect your privacy. Unsubscribe at any time.
      </p>
    </form>
  );
}
