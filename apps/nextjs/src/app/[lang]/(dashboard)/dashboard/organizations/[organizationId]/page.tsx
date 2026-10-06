import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@saasfly/ui/badge";
import { buttonVariants } from "@saasfly/ui/button";
import * as Icons from "@saasfly/ui/icons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@saasfly/ui/table";
import { cn } from "@saasfly/ui";

import { EmptyPlaceholder } from "~/components/empty-placeholder";
import {
  CapacityMeter,
  DateTimeLabel,
  EventStatusBadge,
} from "~/components/event/event-badges";
import { EventCreateButton } from "~/components/event/event-create-button";
import { TournamentCreateButton } from "~/components/tournament/tournament-create-button";
import { TournamentCard } from "~/components/tournament/tournament-card";
import { DashboardShell, StatCard } from "~/components/shell";
import type { Locale } from "~/config/i18n-config";
import { getDictionary } from "~/lib/get-dictionary";
import { trpc } from "~/trpc/server";

interface OrganizationPageProps {
  params: { lang: Locale; organizationId: string };
}

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Organization",
};

export default async function OrganizationPage({
  params: { lang, organizationId },
}: OrganizationPageProps) {
  const id = Number(organizationId);
  if (!Number.isInteger(id) || id <= 0) {
    return notFound();
  }

  const dict = await getDictionary(lang);

  const organization = await trpc.organization.getById
    .query({ organizationId: id })
    .catch(() => null);

  if (!organization) {
    return notFound();
  }

  const events = await trpc.event.listByOrganization.query({
    organizationId: id,
  });

  const tournaments = await trpc.tournament.listByOrganization
    .query({ organizationId: id })
    .catch(() => []);

  const isAtEventLimit =
    organization.entitlements.maxEvents >= 0 &&
    organization.usage.events >= organization.entitlements.maxEvents;

  const countsByEvent = await Promise.all(
    events.map((event) =>
      trpc.checkIn.stats
        .query({ organizationId: id, eventId: event.id })
        .catch(() => ({ confirmed: 0, pending: 0, present: 0 })),
    ),
  );

  const totalRegistrations = countsByEvent.reduce(
    (sum, stats) => sum + stats.confirmed + stats.pending,
    0,
  );
  const totalPresent = countsByEvent.reduce((sum, s) => sum + s.present, 0);
  const totalPending = countsByEvent.reduce((sum, s) => sum + s.pending, 0);

  const quota = (used: number, limit: number) =>
    limit < 0 ? `${used} / ∞` : `${used} / ${limit}`;

  return (
    <div className="space-y-8">
      <DashboardShell
        eyebrow={dict.event.workspace}
        title={organization.name}
        description={dict.event.title_text}
        headerAction={
          <div className="flex flex-wrap items-center gap-2">
            <TournamentCreateButton organizationId={id} />
            <EventCreateButton
              organizationId={id}
              dict={dict.event}
              params={{ lang }}
              atEventLimit={isAtEventLimit}
            />
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={dict.event.registered}
          value={totalRegistrations}
          icon={<Icons.Ticket className="h-4 w-4" />}
          tone="accent"
        />
        <StatCard
          label={dict.event.present}
          value={totalPresent}
          icon={<Icons.CheckIn className="h-4 w-4" />}
          tone="success"
        />
        <StatCard
          label={dict.event.pending_approval}
          value={totalPending}
          icon={<Icons.Clock className="h-4 w-4" />}
          tone="warning"
        />
        <StatCard
          label={dict.event.members}
          value={quota(
            organization.usage.members,
            organization.entitlements.maxMembers,
          )}
          hint={`${dict.event.plan}: ${organization.plan}`}
          icon={<Icons.Users className="h-4 w-4" />}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border/70 bg-card/40 px-4 py-3">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {dict.event.invite_code}
        </span>
        <code className="rounded-md bg-muted px-2.5 py-1 font-mono text-sm tracking-widest">
          {organization.joinCode}
        </code>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {dict.event.events_used}:{" "}
            {quota(
              organization.usage.events,
              organization.entitlements.maxEvents,
            )}
          </span>
          <Link
            href={`/${lang}/dashboard/organizations/${id}/members`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            <Icons.Users className="mr-2 h-3.5 w-3.5" />
            {dict.event.members}
          </Link>
        </div>
      </div>

      {isAtEventLimit ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
          <span className="flex items-center gap-2">
            <Icons.Warning className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            {dict.event.upgrade_hint}
          </span>
          <Link
            href={`/${lang}/dashboard/billing`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            {dict.business.billing.upgrade}
          </Link>
        </div>
      ) : null}

      {/* Organization Tournaments */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <Icons.Trophy className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-bold">Esports Tournaments</h3>
          </div>
          <Link
            href={`/${lang}/dashboard/organizations/${id}/tournaments`}
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            View All ({tournaments.length})
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
                manageHref={`/${lang}/dashboard/organizations/${id}/tournaments/${t.id}`}
              />
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-between rounded-xl border border-dashed border-border/70 p-4 text-sm bg-card/20">
            <div className="flex items-center gap-3">
              <Icons.Gamepad className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-semibold text-xs">No tournaments hosted in this workspace yet</p>
                <p className="text-[11px] text-muted-foreground">Launch single & double elimination brackets for Valorant, CS2, LoL, etc.</p>
              </div>
            </div>
            <TournamentCreateButton organizationId={id} variant="outline" />
          </div>
        )}
      </div>

      {/* Events List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <Icons.Calendar className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-bold">Live Events & Ticketing</h3>
          </div>
        </div>
      </div>

      {events.length ? (
        <div className="overflow-hidden rounded-xl border border-border/70">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>{dict.event.event_name}</TableHead>
                <TableHead className="hidden md:table-cell">
                  {dict.event.starts_at}
                </TableHead>
                <TableHead className="hidden lg:table-cell">
                  {dict.event.location}
                </TableHead>
                <TableHead>{dict.event.status}</TableHead>
                <TableHead>{dict.event.registered}</TableHead>
                <TableHead>{dict.event.present}</TableHead>
                <TableHead className="text-right">
                  {dict.event.roster}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {events.map((event, index) => {
                const stats = countsByEvent[index] ?? {
                  confirmed: 0,
                  pending: 0,
                  present: 0,
                };
                return (
                  <TableRow key={event.id} className="group">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/${lang}/dashboard/organizations/${id}/events/${event.id}`}
                          className="font-medium hover:underline"
                        >
                          {event.name}
                        </Link>
                        {event.requireApproval ? (
                          <Badge variant="warning">
                            {dict.event.require_approval}
                          </Badge>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <DateTimeLabel value={event.startsAt} locale={lang} />
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground lg:table-cell">
                      {event.location ?? "—"}
                    </TableCell>
                    <TableCell>
                      <EventStatusBadge
                        status={event.status}
                        dict={dict.event}
                      />
                    </TableCell>
                    <TableCell>
                      <CapacityMeter
                        used={stats.confirmed + stats.pending}
                        capacity={event.capacity}
                        dict={dict.event}
                        compact
                      />
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {stats.present}
                      <span className="text-muted-foreground">
                        /{stats.confirmed + stats.pending}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/${lang}/dashboard/organizations/${id}/events/${event.id}`}
                        className={cn(
                          buttonVariants({ variant: "outline", size: "sm" }),
                          "opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100",
                        )}
                      >
                        {dict.event.roster}
                        <Icons.ArrowRight className="ml-2 h-3.5 w-3.5" />
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <EmptyPlaceholder className="min-h-[320px] border-dashed bg-card/30">
          <EmptyPlaceholder.Icon name="Calendar" />
          <EmptyPlaceholder.Title>
            {dict.event.no_events_title}
          </EmptyPlaceholder.Title>
          <EmptyPlaceholder.Description>
            {dict.event.no_events_text}
          </EmptyPlaceholder.Description>
          <EventCreateButton
            variant="outline"
            organizationId={id}
            dict={dict.event}
            params={{ lang }}
            atEventLimit={isAtEventLimit}
          />
        </EmptyPlaceholder>
      )}
    </div>
  );
}
