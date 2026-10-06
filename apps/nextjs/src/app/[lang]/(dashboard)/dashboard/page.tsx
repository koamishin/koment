import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { authOptions, getCurrentUser } from "@saasfly/auth";
import { buttonVariants } from "@saasfly/ui/button";
import { Badge } from "@saasfly/ui/badge";
import * as Icons from "@saasfly/ui/icons";
import { cn } from "@saasfly/ui";

import { EmptyPlaceholder } from "~/components/empty-placeholder";
import { DashboardShell, StatCard } from "~/components/shell";
import { OrganizationDialog } from "~/components/event/organization-dialog";
import { TournamentCard } from "~/components/tournament/tournament-card";
import { TournamentCreateButton } from "~/components/tournament/tournament-create-button";
import { EventCreateButton } from "~/components/event/event-create-button";
import {
  DateTimeLabel,
  EventStatusBadge,
} from "~/components/event/event-badges";
import type { Locale } from "~/config/i18n-config";
import { getDictionary } from "~/lib/get-dictionary";
import { trpc } from "~/trpc/server";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard | KoaTournament",
};

export default async function DashboardPage({
  params: { lang },
}: {
  params: {
    lang: Locale;
  };
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect(authOptions?.pages?.signIn ?? "/login-clerk");
  }

  const customer = await trpc.customer.queryCustomer
    .query({ userId: user.id })
    .catch(() => null);

  if (!customer) {
    await trpc.customer.insertCustomer
      .mutate({ userId: user.id })
      .catch(() => null);
  }

  const dict = await getDictionary(lang);

  const organizations = await trpc.organization.listMine
    .query()
    .catch(() => []);

  // Fetch events and tournaments across user's organizations
  const allEventsNested = await Promise.all(
    organizations.map((org) =>
      trpc.event.listByOrganization
        .query({ organizationId: org.id })
        .then((items) =>
          items.map((ev) => ({
            ...ev,
            organizationId: org.id,
            orgName: org.name,
          })),
        )
        .catch(() => []),
    ),
  );

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

  const events = allEventsNested.flat();
  const tournaments = allTournamentsNested.flat();

  const totalEvents = events.length;
  const totalTournaments = tournaments.length;
  const totalTeams = tournaments.reduce((acc, t) => acc + (t.teamsCount ?? 0), 0);
  const activeTournaments = tournaments.filter(
    (t) => t.status === "IN_PROGRESS" || t.status === "REGISTRATION",
  ).length;

  const firstOrgId = organizations[0]?.id;

  return (
    <div className="space-y-8">
      <DashboardShell
        eyebrow="Central Command"
        title="Dashboard Overview"
        description="Monitor active esports tournaments, manage upcoming events, and track attendees."
        headerAction={
          firstOrgId ? (
            <div className="flex flex-wrap items-center gap-2">
              <TournamentCreateButton organizationId={firstOrgId} />
              <EventCreateButton
                organizationId={firstOrgId}
                dict={dict.event}
                params={{ lang }}
              />
            </div>
          ) : (
            <OrganizationDialog dict={dict.event} params={{ lang }} />
          )
        }
      />

      {/* KPI Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Active Tournaments"
          value={activeTournaments}
          hint={`${totalTournaments} total hosted`}
          icon={<Icons.Trophy className="h-4 w-4" />}
          tone="accent"
        />
        <StatCard
          label="Teams Registered"
          value={totalTeams}
          hint="Across all brackets"
          icon={<Icons.Users className="h-4 w-4" />}
          tone="default"
        />
        <StatCard
          label="Hosted Events"
          value={totalEvents}
          hint="Conferences, LANs & Meets"
          icon={<Icons.Calendar className="h-4 w-4" />}
          tone="success"
        />
        <StatCard
          label="Organizations"
          value={organizations.length}
          hint="Workspaces you belong to"
          icon={<Icons.Organization className="h-4 w-4" />}
          tone="warning"
        />
      </div>

      {/* Quick Action Navigation Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="group relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-5 transition-all hover:border-primary/50 hover:shadow-lg">
          <div className="flex items-center justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary">
              <Icons.Swords className="h-5 w-5" />
            </span>
            <Badge variant="outline" className="text-[10px] uppercase font-mono">
              Esports
            </Badge>
          </div>
          <h4 className="font-bold text-base mt-4">Esports Maker</h4>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            Build single & double elimination brackets, seed teams, and score matches.
          </p>
          {firstOrgId ? (
            <Link
              href={`/${lang}/dashboard/tournaments`}
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              Manage Tournaments
              <Icons.ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <Link
              href={`/${lang}/dashboard/tournaments`}
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              Host a Tournament
              <Icons.ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 via-card to-card p-5 transition-all hover:border-blue-500/50 hover:shadow-lg">
          <div className="flex items-center justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 text-blue-500">
              <Icons.Calendar className="h-5 w-5" />
            </span>
            <Badge variant="outline" className="text-[10px] uppercase font-mono">
              Ticketing
            </Badge>
          </div>
          <h4 className="font-bold text-base mt-4">Event Management</h4>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            Configure registration forms, custom fields, approvals, and capacity limits.
          </p>
          {firstOrgId ? (
            <Link
              href={`/${lang}/dashboard/organizations/${firstOrgId}`}
              className="text-xs font-semibold text-blue-500 hover:underline flex items-center gap-1"
            >
              Manage Events
              <Icons.ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <span className="text-xs text-muted-foreground">
              Create an organization first
            </span>
          )}
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-card to-card p-5 transition-all hover:border-emerald-500/50 hover:shadow-lg">
          <div className="flex items-center justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-500">
              <Icons.CheckIn className="h-5 w-5" />
            </span>
            <Badge variant="outline" className="text-[10px] uppercase font-mono">
              Door Ops
            </Badge>
          </div>
          <h4 className="font-bold text-base mt-4">Fast QR Check-in</h4>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            Scan attendee QR passes with camera or rapid-input code at the door.
          </p>
          <Link
            href={`/${lang}/dashboard/registrations`}
            className="text-xs font-semibold text-emerald-500 hover:underline flex items-center gap-1"
          >
            My Passes & Roster
            <Icons.ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="group relative overflow-hidden rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-500/10 via-card to-card p-5 transition-all hover:border-purple-500/50 hover:shadow-lg">
          <div className="flex items-center justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20 text-purple-500">
              <Icons.Organization className="h-5 w-5" />
            </span>
            <Badge variant="outline" className="text-[10px] uppercase font-mono">
              Workspace
            </Badge>
          </div>
          <h4 className="font-bold text-base mt-4">Workspaces</h4>
          <p className="text-xs text-muted-foreground mt-1 mb-4">
            Invite teammates with role permissions (Owner, Admin, Staff, Member).
          </p>
          <Link
            href={`/${lang}/dashboard/organizations`}
            className="text-xs font-semibold text-purple-500 hover:underline flex items-center gap-1"
          >
            Organizations Hub
            <Icons.ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Tournaments Section */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <Icons.Trophy className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-bold">Esports Tournaments</h3>
          </div>
          <Link
            href={`/${lang}/dashboard/tournaments`}
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            View All Tournaments
            <Icons.ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {tournaments.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {tournaments.slice(0, 3).map((t) => (
              <TournamentCard
                key={t.id}
                tournament={t}
                lang={lang}
                manageHref={`/${lang}/dashboard/organizations/${t.organizationId}/tournaments/${t.id}`}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 p-8 text-center bg-card/20">
            <Icons.Gamepad className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <h4 className="font-semibold text-sm">No Tournaments Hosted Yet</h4>
            <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4">
              Start an esports bracket for Valorant, CS2, League of Legends, or any custom game.
            </p>
            {firstOrgId ? (
              <TournamentCreateButton organizationId={firstOrgId} variant="outline" label="Host a Tournament" />
            ) : (
              <Link
                href={`/${lang}/dashboard/tournaments`}
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5 text-xs")}
              >
                <Icons.Add className="h-4 w-4" />
                Host a Tournament
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Events Section */}
      <div className="space-y-4 pt-4">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <Icons.Calendar className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-bold">Upcoming Events</h3>
          </div>
          {firstOrgId ? (
            <Link
              href={`/${lang}/dashboard/organizations/${firstOrgId}`}
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              View All Events
              <Icons.ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : null}
        </div>

        {events.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events.slice(0, 3).map((event) => (
              <div
                key={event.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/70 bg-card/50 p-5 transition-all hover:border-primary/40 hover:shadow-md"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono text-muted-foreground uppercase">
                      {event.orgName}
                    </span>
                    <EventStatusBadge status={event.status} dict={dict.event} />
                  </div>
                  <Link
                    href={`/${lang}/dashboard/organizations/${event.organizationId}/events/${event.id}`}
                    className="block font-bold text-base group-hover:text-primary transition-colors line-clamp-1"
                  >
                    {event.name}
                  </Link>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Icons.Clock className="h-3.5 w-3.5 text-primary" />
                    <DateTimeLabel value={event.startsAt} locale={lang} />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 mt-4 border-t border-border/50 text-xs">
                  <span className="text-muted-foreground">
                    {event.capacity ? `${event.capacity} cap` : "Unlimited"}
                  </span>
                  <Link
                    href={`/${lang}/dashboard/organizations/${event.organizationId}/events/${event.id}`}
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" }),
                      "text-xs h-7",
                    )}
                  >
                    Manage Roster
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 p-8 text-center bg-card/20">
            <Icons.Calendar className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <h4 className="font-semibold text-sm">No Events Created Yet</h4>
            <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4">
              Host your first physical or virtual gathering, take registrations, and run the door.
            </p>
            {firstOrgId ? (
              <EventCreateButton
                organizationId={firstOrgId}
                dict={dict.event}
                params={{ lang }}
                variant="outline"
              />
            ) : null}
          </div>
        )}
      </div>

      {/* Organizations Switcher / Onboarding */}
      {organizations.length === 0 ? (
        <EmptyPlaceholder>
          <EmptyPlaceholder.Icon name="Organization" />
          <EmptyPlaceholder.Title>
            {dict.event.no_orgs_title}
          </EmptyPlaceholder.Title>
          <EmptyPlaceholder.Description>
            {dict.event.create_first_org}
          </EmptyPlaceholder.Description>
          <OrganizationDialog dict={dict.event} params={{ lang }} />
        </EmptyPlaceholder>
      ) : null}
    </div>
  );
}
