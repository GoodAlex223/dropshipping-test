"use client";

import { useEffect } from "react";
import { XCircle } from "lucide-react";
import { StatusScreen } from "@/components/common/StatusScreen";
import { system } from "@/content/system";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[App Error]", error);
  }, [error]);

  return (
    <StatusScreen
      icon={XCircle}
      tone="error"
      title={system.error.title}
      description={system.error.description}
      meta={error.digest ? system.error.errorId(error.digest) : undefined}
      actions={[
        { label: system.error.retry, onClick: () => reset() },
        {
          label: system.error.home,
          onClick: () => (window.location.href = "/"),
          variant: "outline",
        },
      ]}
    />
  );
}
