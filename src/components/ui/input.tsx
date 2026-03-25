import * as React from "react";
import { cn } from "@/lib/utils";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const hasValue = Object.prototype.hasOwnProperty.call(props, "value");
  const safeValue = props.value ?? "";

  return (
    <input
      {...props}
      value={hasValue ? safeValue : props.value}
      className={cn(
        "h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-800 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200",
        props.className
      )}
    />
  );
}
