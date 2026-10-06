import { redirect } from "next/navigation";
import Link from "next/link";

import { authOptions, getCurrentUser } from "@saasfly/auth";
import { Button, buttonVariants } from "@saasfly/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@saasfly/ui/tabs";
import * as Icons from "@saasfly/ui/icons";
import { cn } from "@saasfly/ui";

import { EmptyPlaceholder } from "~/components/empty-placeholder";
import { RegistrationPassCard } from "~/components/event/registration-pass-card";
import { TournamentPassCard, type TournamentPassData } from "~/components/tournament/tournament-pass-card";
import { DashboardShell, StatCard } from "~/components/shell";
import type { Locale } from "~/config/i18n-config";
import { getDictionary } from "~/lib/get-dictionary";
import { trpc } from "~/trpc/server";

interface MyRegistrationsPageProps {
  params: { lang: Locale };
}

export const dynamic = "force-dynamic";

export const metadata = {
  title: "My Registrations & Passes | Dashboard",
  description: "View your event passes, QR codes, and tournament team registrations.",
};

export default async function MyRegistrationsPage({
  params: { lang },
}: MyRegistrationsPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect(authOptions?.pages?.signIn ?? "/login-clerk");
  }

  const [dict, eventRegistrations, tournamentPasses] = await Promise.all([
    getDictionary(lang),
    trpc.registration.listMine.query().catch(() => []),
    trpc.tournament.listMyRegistrations.query().catch(() => []),
  ]);

  const now = Date.now();
  const upcomingEvents = eventRegistrations.filter(
    (r) =>
      new Date(r.startsAt).getTime() >= now && r.eventStatus !== "CANCELED",
  );
  const activeTournaments = tournamentPasses.filter(
    (t) =>
      t.tournamentStatus === "REGISTRATION" ||
      t.tournamentStatus === "IN_PROGRESS",
  );

  const totalPasses = eventRegistrations.length + tournamentPasses.length;

  return (
    <div className="space-y-8">
      <DashboardShell
        title="My Passes & Registrations"
        description="Access your door passes, QR check-in codes, and tournament team roster registrations."
        headerAction={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/${lang}/tournaments`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5 text-xs")}
            >
              <Icons.Swords className="h-3.5 w-3.5" />
              Explore Tournaments
            </Link>
            <Link
              href={`/${lang}/events`}
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5 text-xs")}
            >
              <Icons.Calendar className="h-3.5 w-3.5" />
              Browse Events
            </Link>
          </div>
        }
      />

      {/* KPI Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Tournament Rosters"
          value={tournamentPasses.length}
          hint={`${activeTournaments.length} active or in-progress`}
          icon={<Icons.Swords className="h-4 w-4" />}
          tone="accent"
        />
        <StatCard
          label="Event Passes"
          value={eventRegistrations.length}
          hint={`${upcomingEvents.length} upcoming events`}
          icon={<Icons.Calendar className="h-4 w-4" />}
          tone="success"
        />
        <StatCard
          label="Total Registrations"
          value={totalPasses}
          hint="Enrolled passes & teams"
          icon={<Icons.Ticket className="h-4 w-4" />}
          tone="default"
        />
      </div>

      {totalPasses > 0 ? (
        <Tabs defaultValue={tournamentPasses.length > 0 ? "tournaments" : "events"} className="space-y-6">
          <TabsList className="bg-card/70 border border-border/70 p-1">
            <TabsTrigger value="tournaments" className="gap-2 text-xs font-semibold">
              <Icons.Swords className="h-3.5 w-3.5" />
              Esports Tournaments ({tournamentPasses.length})
            </TabsTrigger>
            <TabsTrigger value="events" className="gap-2 text-xs font-semibold">
              <Icons.Calendar className="h-3.5 w-3.5" />
              Event Passes ({eventRegistrations.length})
            </TabsTrigger>
          </TabsList>

          {/* Tournament Passes Tab */}
          <TabsContent value="tournaments" className="space-y-4">
            {tournamentPasses.length > 0 ? (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {tournamentPasses.map((pass) => (
                  <TournamentPassCard
                    key={pass.teamId}
                    pass={pass as TournamentPassData}
                    lang={lang}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 p-8 text-center bg-card/30">
                <Icons.Swords className="h-10 w-10 text-muted-foreground/60 mb-3" />
                <h4 className="text-base font-semibold">No Tournament Teams Registered</h4>
                <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4">
                  Register your team for premier Valorant, CS2, LoL, or custom brackets.
                </p>
                <Button asChild size="sm">
                  <Link href={`/${lang}/tournaments`}>
                    <Icons.Swords className="mr-2 h-4 w-4" />
                    Explore Tournaments
                  </Link>
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Event Passes Tab */}
          <TabsContent value="events" className="space-y-4">
            {eventRegistrations.length > 0 ? (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {eventRegistrations.map((registration) => (
                  <RegistrationPassCard
                    key={registration.id}
                    registration={{
                      id: registration.id,
                      status: registration.status,
                      checkInCode: registration.checkInCode,
                      checkedInAt: registration.checkedInAt,
                      eventName: registration.eventName,
                      startsAt: registration.startsAt,
                      endsAt: registration.endsAt,
                      location: registration.location,
                      organizationName: registration.organizationName,
                      eventSlug: registration.eventSlug,
                      eventStatus: registration.eventStatus,
                    }}
                    dict={dict.event}
                    lang={lang}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 p-8 text-center bg-card/30">
                <Icons.Calendar className="h-10 w-10 text-muted-foreground/60 mb-3" />
                <h4 className="text-base font-semibold">No Event Passes</h4>
                <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4">
                  Browse public events, conferences, and conventions to reserve your spot.
                </p>
                <Button asChild size="sm">
                  <Link href={`/${lang}/events`}>
                    <Icons.Calendar className="mr-2 h-4 w-4" />
                    Browse Events
                  </Link>
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      ) : (
        <EmptyPlaceholder className="min-h-[420px] border-dashed bg-card/30">
          <EmptyPlaceholder.Icon name="Ticket" />
          <EmptyPlaceholder.Title>
            {dict.event.no_my_registrations_title}
          </EmptyPlaceholder.Title>
          <EmptyPlaceholder.Description>
            You haven&apos;t enrolled in any esports tournaments or events yet. Browse open competitions to register.
          </EmptyPlaceholder.Description>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button asChild>
              <Link href={`/${lang}/tournaments`}>
                <Icons.Swords className="mr-2 h-4 w-4" />
                Explore Tournaments
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/${lang}/events`}>
                <Icons.Calendar className="mr-2 h-4 w-4" />
                Browse Events
              </Link>
            </Button>
          </div>
        </EmptyPlaceholder>
      )}
    </div>
  );
}
