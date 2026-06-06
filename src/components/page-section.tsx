import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function StatCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: "primary" | "success" | "warning" | "muted";
}) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-5 shadow-[var(--shadow-card)]",
        tone === "primary" && "border-transparent text-primary-foreground",
      )}
      style={tone === "primary" ? { backgroundImage: "var(--gradient-primary)" } : undefined}
    >
      <p
        className={cn(
          "text-xs font-medium uppercase tracking-wider",
          tone === "primary" ? "text-primary-foreground/80" : "text-muted-foreground",
        )}
      >
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
      {hint && (
        <p
          className={cn(
            "mt-1 text-xs",
            tone === "primary" ? "text-primary-foreground/70" : "text-muted-foreground",
          )}
        >
          {hint}
        </p>
      )}
    </div>
  );
}

export function Card({
  children,
  className,
  title,
  action,
}: {
  children: ReactNode;
  className?: string;
  title?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-xl border bg-card shadow-[var(--shadow-card)]",
        className,
      )}
    >
      {(title || action) && (
        <header className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
          {action}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed bg-card/50 p-10 text-center">
      <h3 className="text-base font-semibold">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}