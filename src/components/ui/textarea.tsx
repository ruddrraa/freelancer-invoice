import * as React from "react";
import { cn } from "@/lib/utils";

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const hasValue = Object.prototype.hasOwnProperty.call(props, "value");
  const safeValue = props.value ?? "";

  return (
    <textarea
      {...props}
      value={hasValue ? safeValue : props.value}
      className={cn(
        "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200",
        props.className
      )}
    />
  );
}
