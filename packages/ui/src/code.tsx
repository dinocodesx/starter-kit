import React, { type JSX } from "react";
import { cn } from "./lib/utils";

export function Code({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}): JSX.Element {
  return (
    <code className={cn("rounded bg-stone-100 px-1.5 py-0.5 font-mono text-sm font-semibold text-stone-900", className)}>
      {children}
    </code>
  );
}
