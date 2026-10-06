import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { authOptions, getCurrentUser } from "@saasfly/auth";
import { buttonVariants } from "@saasfly/ui/button";
import { Card, CardContent } from "@saasfly/ui/card";
import * as Icons from "@saasfly/ui/icons";
import { cn } from "@saasfly/ui";

import { EmptyPlaceholder } from "~/components/empty-placeholder";
import { DashboardShell, StatCard } from "~/components/shell";
import { TournamentCard } from "~/components/tournament/tournament-card";
import { TournamentCreateButton } from "~/components/tournament/tournament-create-button";
import { OrganizationDialog } from "~/components/event/organization-dialog";
import type { Locale } from "~/config/i18n-config";
import { getDictionary } from "~/lib/get-dictionary";
import { trpc } from "~/trpc/server";

interface TournamentsDashboardPageProps {
  params: { lang: Locale };
  searchParams?: { action?: string; create?: string };
}

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Tournaments Studio | Dashboard",
  description: "Manage esports tournaments, seed teams, and generate live brackets.",
};

export default async function TournamentsDashboardPage({
  params: { lang },
  searchParams,
}: TournamentsDashboardPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect(authOptions?.pages?.signIn ?? "/login-clerk");
  }

  const [dict, organizations] = await Promise.all([
    getDictionary(lang),
    trpc.organization.listMine.query().catch(() => []),
  ]);

  const shouldAutoOpen =
    searchParams?.action === "new" || searchParams?.create === "true";

  if (organizations.length === 0) {
    return (
      <DashboardShell
        eyebrow="Esports Studio"
        title="Tournaments Studio"
        description="Launch single & double elimination brackets, seed teams, and record live scores."
      >
        <EmptyPlaceholder className="min-h-[420px] border-dashed bg-card/30">
          <EmptyPlaceholder.Icon name="Trophy" />
          <EmptyPlaceholder.Title>
            Organizer Workspace Required
          </EmptyPlaceholder.Title>
          <EmptyPlaceholder.Description>
            To host and manage esports tournaments, you need an organization workspace (club, clan, or league). Create one below in seconds to get started.
          </EmptyPlaceholder.Description>
          <OrganizationDialog dict={dict.event} params={{ lang }} />
        </EmptyPlaceholder>

        <Card className="border-border/60 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm">
          <CardContent className="grid gap-6 p-6 sm:grid-cols-3">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icons.Swords className="h-5 w-5" />
              </span>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold">Interactive Brackets</h4>
                <p className="text-xs text-muted-foreground">
                  Automated single & double elimination bracket trees with live score reporting.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500">
                <Icons.Users className="h-5 w-5" />
              </span>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold">Rosters & Seeding</h4>
                <p className="text-xs text-muted-foreground">
                  Accept team sign-ups, set seed ranks, and manage captain contacts.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                <Icons.Share className="h-5 w-5" />
              </span>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold">Public Sharing</h4>
                <p className="text-xs text-muted-foreground">
                  Share live brackets with viewers, streams, and registered players.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </DashboardShell>
    );
  }

  // Fetch tournaments across all user's organizations
  const allTournamentsNested = await Promise.all(
    organizations.map((org) =>
      trpc.tournament.listByOrganization
        .query({ organizationId: org.id })
        .then((items) =>
          items.map((t) => ({
            ...t,
            organizationId: org.id,
            organizationName: org.name,
          })),
        )
        .catch(() => []),
    ),
  );

  const tournaments = allTournamentsNested.flat();
  const totalTournaments = tournaments.length;
  const totalTeams = tournaments.reduce((acc, t) => acc + (t.teamsCount ?? 0), 0);
  const activeTournaments = tournaments.filter(
    (t) => t.status === "IN_PROGRESS" || t.status === "REGISTRATION",
  ).length;

  const orgSummaries = organizations.map((o) => ({ id: o.id, name: o.name }));

  return (
    <div className="space-y-8">
      <DashboardShell
        eyebrow="Esports Studio"
        title="Tournaments Studio"
        description="Create and manage tournament brackets, seed team rosters, and update live scores."
        headerAction={
          <div className="flex flex-wrap items-center gap-2">
            <TournamentCreateButton
              organizations={orgSummaries}
              autoOpen={shouldAutoOpen}
              label="Host Tournament"
              lang={lang}
            />
            <Link
              href={`/${lang}/tournaments`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5 text-xs")}
            >
              <Icons.Trophy className="h-3.5 w-3.5" />
              Public Hub
            </Link>
          </div>
        }
      />

      {/* KPI Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Hosted Tournaments"
          value={totalTournaments}
          hint="Across all workspaces"
          icon={<Icons.Trophy className="h-4 w-4" />}
          tone="accent"
        />
        <StatCard
          label="Active Brackets"
          value={activeTournaments}
          hint="Open for registration or live"
          icon={<Icons.Swords className="h-4 w-4" />}
          tone="default"
        />
        <StatCard
          label="Registered Teams"
          value={totalTeams}
          hint="Enrolled in your tournaments"
          icon={<Icons.Users className="h-4 w-4" />}
          tone="success"
        />
        <StatCard
          label="Organizer Workspaces"
          value={organizations.length}
          hint="Available to host brackets"
          icon={<Icons.Organization className="h-4 w-4" />}
          tone="warning"
        />
      </div>

      {/* Tournaments Grid */}
      {tournaments.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <h3 className="text-lg font-bold">Your Tournaments ({tournaments.length})</h3>
            <span className="text-xs text-muted-foreground">
              Click any tournament to enter the Live Bracket Studio
            </span>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {tournaments.map((t) => (
              <TournamentCard
                key={t.id}
                tournament={t}
                lang={lang}
                manageHref={`/${lang}/dashboard/organizations/${t.organizationId}/tournaments/${t.id}`}
              />
            ))}
          </div>
        </div>
      ) : (
        <EmptyPlaceholder className="min-h-[360px] border-dashed bg-card/30">
          <EmptyPlaceholder.Icon name="Gamepad" />
          <EmptyPlaceholder.Title>
            No Tournaments Hosted Yet
          </EmptyPlaceholder.Title>
          <EmptyPlaceholder.Description>
            You haven&apos;t created any tournaments yet. Launch a single or double elimination bracket now.
          </EmptyPlaceholder.Description>
          <TournamentCreateButton
            organizations={orgSummaries}
            autoOpen={shouldAutoOpen}
            label="Host Your First Tournament"
            variant="outline"
            lang={lang}
          />
        </EmptyPlaceholder>
      )}
    </div>
  );
}
