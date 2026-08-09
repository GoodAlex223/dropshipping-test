"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { StatusScreen } from "@/components/common/StatusScreen";
import { newsletter, type NewsletterOutcomeCopy } from "@/content/newsletter";

type ConfirmState =
  | { status: "loading" }
  | { status: "success"; copy: NewsletterOutcomeCopy }
  | { status: "error"; copy: NewsletterOutcomeCopy };

function ConfirmContent() {
  const searchParams = useSearchParams();
  const token = searchParams?.get("token") ?? null;

  const [state, setState] = useState<ConfirmState>(
    token
      ? { status: "loading" }
      : { status: "error", copy: newsletter.confirm.byCode.TOKEN_REQUIRED }
  );

  useEffect(() => {
    if (!token) return;

    async function confirmSubscription() {
      try {
        const response = await fetch(`/api/newsletter/confirm?token=${token}`);
        const data = await response.json().catch(() => ({}));
        // API prose is EN log text; `code` drives the Ukrainian copy.
        const copy =
          (data.code && newsletter.confirm.byCode[data.code]) ||
          (response.ok ? newsletter.confirm.byCode.CONFIRMED : newsletter.confirm.fallback);
        setState({ status: response.ok ? "success" : "error", copy });
      } catch {
        setState({ status: "error", copy: newsletter.confirm.fallback });
      }
    }

    confirmSubscription();
  }, [token]);

  if (state.status === "loading") {
    return (
      <StatusScreen
        icon={Loader2}
        iconClassName="animate-spin"
        title={newsletter.confirm.loading.title}
        description={newsletter.confirm.loading.description}
      />
    );
  }

  if (state.status === "success") {
    return (
      <StatusScreen
        icon={CheckCircle2}
        tone="success"
        title={state.copy.title}
        description={state.copy.description}
        actions={[{ label: newsletter.actions.continueShopping, href: "/" }]}
      />
    );
  }

  return (
    <StatusScreen
      icon={XCircle}
      tone="error"
      title={state.copy.title}
      description={state.copy.description}
      actions={[{ label: newsletter.actions.goHome, href: "/", variant: "outline" }]}
    />
  );
}

export default function NewsletterConfirmPage() {
  return (
    <Suspense
      fallback={
        <StatusScreen
          icon={Loader2}
          iconClassName="animate-spin"
          title={newsletter.confirm.loading.title}
        />
      }
    >
      <ConfirmContent />
    </Suspense>
  );
}
