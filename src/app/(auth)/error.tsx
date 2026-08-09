"use client";

import { useEffect } from "react";
import { XCircle } from "lucide-react";
import { StatusScreen } from "@/components/common/StatusScreen";
import { auth } from "@/content/auth";

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Auth Error]", error);
  }, [error]);

  return (
    <StatusScreen
      icon={XCircle}
      tone="error"
      title={auth.error.title}
      description={auth.error.description}
      meta={error.digest ? auth.error.errorId(error.digest) : undefined}
      actions={[
        { label: auth.error.retry, onClick: () => reset() },
        { label: auth.error.backToLogin, href: "/login", variant: "outline" },
      ]}
    />
  );
}
