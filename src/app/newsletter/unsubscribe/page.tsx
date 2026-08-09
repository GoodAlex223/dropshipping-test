"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, Loader2, Mail } from "lucide-react";
import { StatusScreen } from "@/components/common/StatusScreen";
import { newsletter, type NewsletterOutcomeCopy } from "@/content/newsletter";

type UnsubscribeState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; copy: NewsletterOutcomeCopy }
  | { status: "error"; copy: NewsletterOutcomeCopy };

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const email = searchParams?.get("email") ?? null;
  const token = searchParams?.get("token") ?? null;

  const [state, setState] = useState<UnsubscribeState>({ status: "idle" });

  async function handleUnsubscribe() {
    if (!email || !token) {
      setState({ status: "error", copy: newsletter.unsubscribe.invalidLink });
      return;
    }

    setState({ status: "loading" });
    try {
      const response = await fetch("/api/newsletter/unsubscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token }),
      });

      const data = await response.json().catch(() => ({}));
      // API prose is EN log text; `code` drives the Ukrainian copy.
      const copy =
        (data.code && newsletter.unsubscribe.byCode[data.code]) ||
        (response.ok
          ? newsletter.unsubscribe.byCode.UNSUBSCRIBED
          : newsletter.unsubscribe.fallback);
      setState({ status: response.ok ? "success" : "error", copy });
    } catch {
      setState({ status: "error", copy: newsletter.unsubscribe.fallback });
    }
  }

  if (!email || !token) {
    return (
      <StatusScreen
        icon={XCircle}
        tone="error"
        title={newsletter.unsubscribe.invalidLink.title}
        description={newsletter.unsubscribe.invalidLink.description}
        actions={[{ label: newsletter.actions.goHome, href: "/", variant: "outline" }]}
      />
    );
  }

  if (state.status === "idle") {
    return (
      <StatusScreen
        icon={Mail}
        title={newsletter.unsubscribe.idle.title}
        description={newsletter.unsubscribe.idle.prompt(email)}
        actions={[
          {
            label: newsletter.unsubscribe.idle.confirm,
            onClick: handleUnsubscribe,
            variant: "destructive",
          },
        ]}
      />
    );
  }

  if (state.status === "loading") {
    return (
      <StatusScreen
        icon={Loader2}
        iconClassName="animate-spin"
        title={newsletter.unsubscribe.processing.title}
        description={newsletter.unsubscribe.processing.description}
      />
    );
  }

  const icon = state.status === "success" ? CheckCircle2 : XCircle;
  return (
    <StatusScreen
      icon={icon}
      tone={state.status}
      title={state.copy.title}
      description={state.copy.description}
      actions={[{ label: newsletter.actions.goHome, href: "/", variant: "outline" }]}
    />
  );
}

export default function NewsletterUnsubscribePage() {
  return (
    <Suspense
      fallback={
        <StatusScreen
          icon={Loader2}
          iconClassName="animate-spin"
          title={newsletter.unsubscribe.processing.title}
        />
      }
    >
      <UnsubscribeContent />
    </Suspense>
  );
}
