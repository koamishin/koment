import * as React from "react";

import { cn } from "@saasfly/ui";

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  eyebrow?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0 space-y-2">
        {eyebrow ? (
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {eyebrow}
          </div>
        ) : null}
        <h1 className="font-heading text-2xl font-semibold leading-tight tracking-tight md:text-3xl">
          {title}
        </h1>
        {description ? (
          <div className="max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
            {description}
          </div>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "default",
  className,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: React.ReactNode;
  tone?: "default" | "success" | "warning" | "accent";
  className?: string;
}) {
  const toneRing: Record<string, string> = {
    default: "text-foreground",
    success: "text-green-600 dark:text-green-400",
    warning: "text-amber-600 dark:text-amber-400",
    accent: "text-primary",
  };

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border border-border/70 bg-card/60 p-5 backdrop-blur-sm transition-colors hover:border-primary/40",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full bg-primary/10 blur-2xl transition-opacity group-hover:bg-primary/20"
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <p
            className={cn(
              "text-3xl font-semibold tabular-nums leading-none",
              toneRing[tone],
            )}
          >
            {value}
          </p>
          {hint ? (
            <p className="pt-1 text-xs text-muted-foreground">{hint}</p>
          ) : null}
        </div>
        {icon ? (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-primary/15 group-hover:text-primary">
            {icon}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function DashboardShell(props: {
  title?: string;
  description?: React.ReactNode;
  breadcrumb?: boolean;
  headerAction?: React.ReactNode;
  eyebrow?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <div className="space-y-6">
      {props.title ?? props.headerAction ?? props.eyebrow ? (
        <PageHeader
          title={props.title}
          description={props.description}
          actions={props.headerAction}
          eyebrow={props.eyebrow}
        />
      ) : null}
      {props.children ? (
        <div className={props.contentClassName ?? props.className}>
          {props.children}
        </div>
      ) : null}
    </div>
  );
}
