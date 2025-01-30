"use client";

import { useEffect } from "react";
import { IconButton } from "@/components/ui/IconButton";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center gap-2">
      <h2 className="text-2xl font-bold">Something went wrong!</h2>
      <IconButton onClick={() => reset()}>Try again</IconButton>
    </div>
  );
}
