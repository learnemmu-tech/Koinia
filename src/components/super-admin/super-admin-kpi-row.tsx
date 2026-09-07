import { cn } from "@/lib/utils";

export type SuperAdminKpiItem = {
  label: string;
  value: number | string;
  hint?: string;
  tone?: "default" | "success" | "warning" | "danger";
};

const toneClass: Record<NonNullable<SuperAdminKpiItem["tone"]>, string> = {
  default: "text-foreground",
  success: "text-emerald-400",
  warning: "text-amber-400",
  danger: "text-red-400",
};

export function SuperAdminKpiRow({
  items,
  className,
}: {
  items: SuperAdminKpiItem[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid divide-y divide-border/40 rounded-xl border border-border/50 bg-card sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-3 xl:grid-cols-6",
        className
      )}
    >
      {items.map((item) => (
        <div key={item.label} className="px-4 py-3.5">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {item.label}
          </p>
          <p
            className={cn(
              "mt-1 font-heading text-xl font-semibold tabular-nums tracking-tight",
              toneClass[item.tone ?? "default"]
            )}
          >
            {typeof item.value === "number"
              ? item.value.toLocaleString("en-US")
              : item.value}
          </p>
          {item.hint ? (
            <p className="mt-0.5 text-[11px] text-muted-foreground">{item.hint}</p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
