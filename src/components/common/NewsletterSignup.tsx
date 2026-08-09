"use client";

import { useState, FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { newsletter } from "@/content/newsletter";

// TASK-039: externalize — success-path strings below stay inline until the
// i18n library lands; error-path copy already lives in src/content/newsletter.ts
// (G4 code mapping).
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

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        // data.error is EN API/log text — map the machine code instead.
        toast.error(
          (data.code && newsletter.signup.byCode[data.code]) || newsletter.signup.fallback
        );
        return;
      }

      setIsSuccess(true);
      setEmail("");
      toast.success("Перевірте пошту, щоб підтвердити підписку");
    } catch {
      toast.error(newsletter.signup.fallback);
    } finally {
      setIsLoading(false);
    }
  }

  if (isSuccess) {
    return (
      <div className="border-border bg-muted flex items-start gap-2 rounded-md border p-3">
        <CheckCircle2 className="text-foreground h-5 w-5 flex-shrink-0" />
        <p className="text-foreground text-sm">Перевірте пошту, щоб підтвердити підписку!</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Input
        type="email"
        placeholder="Ваш email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={isLoading}
        required
        className="bg-card"
      />
      <Button type="submit" disabled={isLoading} className="w-full" size="sm">
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isLoading ? "Підписуємось..." : "Підписатися"}
      </Button>
      <p className="text-muted-foreground text-xs">
        Ми поважаємо вашу приватність. Відписатися можна будь-коли.
      </p>
    </form>
  );
}
