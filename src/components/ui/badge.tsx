import { cn } from "@/lib/utils";

export function Badge({
  text,
  variant,
}: {
  text: string;
  variant: "pending" | "paid" | "overdue";
}) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-1 text-xs font-medium",
        variant === "paid" && "bg-emerald-100 text-emerald-800",
        variant === "pending" && "bg-amber-100 text-amber-800",
        variant === "overdue" && "bg-rose-100 text-rose-800"
      )}
    >
      {text}
    </span>
  );
}
