import { DashboardShell } from "~/components/shell";

export default function TournamentsLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      <DashboardShell
        eyebrow="Esports Studio"
        title="Tournaments Studio"
        description="Create and manage tournament brackets, seed team rosters, and update live scores."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="h-28 rounded-2xl border border-border/60 bg-card/40" />
          <div className="h-28 rounded-2xl border border-border/60 bg-card/40" />
          <div className="h-28 rounded-2xl border border-border/60 bg-card/40" />
          <div className="h-28 rounded-2xl border border-border/60 bg-card/40" />
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 pt-4">
          <div className="h-64 rounded-2xl border border-border/60 bg-card/40" />
          <div className="h-64 rounded-2xl border border-border/60 bg-card/40" />
          <div className="h-64 rounded-2xl border border-border/60 bg-card/40" />
        </div>
      </DashboardShell>
    </div>
  );
}
