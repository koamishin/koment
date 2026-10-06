import { DashboardShell } from "~/components/shell";

export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      <DashboardShell
        eyebrow="Central Command"
        title="Dashboard Overview"
        description="Monitor active esports tournaments, manage upcoming events, and track attendees."
      >
        {/* KPI Skeleton Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="h-28 rounded-2xl border border-border/60 bg-card/40" />
          <div className="h-28 rounded-2xl border border-border/60 bg-card/40" />
          <div className="h-28 rounded-2xl border border-border/60 bg-card/40" />
          <div className="h-28 rounded-2xl border border-border/60 bg-card/40" />
        </div>

        {/* Quick Nav Skeleton */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="h-44 rounded-2xl border border-border/60 bg-card/40" />
          <div className="h-44 rounded-2xl border border-border/60 bg-card/40" />
          <div className="h-44 rounded-2xl border border-border/60 bg-card/40" />
          <div className="h-44 rounded-2xl border border-border/60 bg-card/40" />
        </div>
      </DashboardShell>
    </div>
  );
}
