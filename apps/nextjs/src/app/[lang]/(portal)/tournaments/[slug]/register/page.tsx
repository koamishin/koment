import Link from "next/link";
import { notFound } from "next/navigation";
import { trpc } from "~/trpc/server";
import type { Locale } from "~/config/i18n-config";
import { Badge } from "@saasfly/ui/badge";
import { buttonVariants } from "@saasfly/ui/button";
import * as Icons from "@saasfly/ui/icons";
import { cn } from "@saasfly/ui";

import {
  GameBadge,
  TournamentStatusBadge,
  type TournamentStatus,
} from "~/components/tournament/tournament-badges";
import { TeamRegisterForm } from "~/components/tournament/team-register-form";

interface TournamentRegisterPageProps {
  params: { lang: Locale; slug: string };
}

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params: { slug },
}: TournamentRegisterPageProps) {
  const data = await trpc.tournament.getBySlug
    .query({ slug })
    .catch(() => null);

  if (!data?.tournament) {
    return { title: "Register for Tournament" };
  }

  return {
    title: `Register: ${data.tournament.name} | KoaTournament`,
    description: `Student and team registration for ${data.tournament.name} (${data.tournament.game}). Claim your bracket spot now.`,
  };
}

export default async function TournamentRegisterPage({
  params: { lang, slug },
}: TournamentRegisterPageProps) {
  const data = await trpc.tournament.getBySlug
    .query({ slug })
    .catch(() => null);

  if (!data?.tournament) {
    return notFound();
  }

  const { tournament, teams } = data;
  const isFull = teams.length >= tournament.maxTeams;
  const canRegister =
    tournament.status === "REGISTRATION" && !isFull;

  const formattedDate = new Intl.DateTimeFormat(lang, {
    weekday: "short",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(tournament.startsAt));

  return (
    <div className="container max-w-3xl py-8 md:py-12 space-y-8">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <Link
          href={`/${lang}/tournaments/${tournament.slug}`}
          className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
        >
          <Icons.ChevronLeft className="h-4 w-4" />
          Back to Live Bracket & Info
        </Link>
        <span className="text-[11px] font-mono text-muted-foreground">
          {teams.length} / {tournament.maxTeams} Teams Enrolled
        </span>
      </div>

      {/* Hero Header Card */}
      <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/15 via-card to-card p-6 md:p-8 shadow-2xl backdrop-blur-xl space-y-4">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-primary/20 blur-3xl"
        />

        <div className="flex flex-wrap items-center gap-2">
          <GameBadge game={tournament.game} />
          <TournamentStatusBadge status={tournament.status as TournamentStatus} />
          <Badge variant="outline" className="font-mono text-xs">
            {tournament.gameFormat || "5v5"}
          </Badge>
          {tournament.prizePool ? (
            <Badge variant="outline" className="font-mono text-xs text-amber-500 border-amber-500/30">
              Prize: {tournament.prizePool}
            </Badge>
          ) : null}
        </div>

        <div>
          {tournament.organizationName ? (
            <span className="text-xs font-mono uppercase tracking-wider text-primary font-bold">
              Hosted by {tournament.organizationName}
            </span>
          ) : null}
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground mt-1">
            {tournament.name}
          </h1>
        </div>

        {tournament.description ? (
          <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
            {tournament.description}
          </p>
        ) : null}

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs border-t border-border/60">
          <div>
            <span className="text-muted-foreground uppercase font-mono text-[10px]">
              Match Start
            </span>
            <p className="font-semibold text-foreground mt-0.5">{formattedDate}</p>
          </div>
          <div>
            <span className="text-muted-foreground uppercase font-mono text-[10px]">
              Slots Remaining
            </span>
            <p className="font-semibold text-foreground mt-0.5">
              {Math.max(0, tournament.maxTeams - teams.length)} open
            </p>
          </div>
          <div>
            <span className="text-muted-foreground uppercase font-mono text-[10px]">
              Format
            </span>
            <p className="font-semibold text-foreground mt-0.5">
              {tournament.matchType || "BO3"} • {tournament.tournamentType || "SINGLE_ELIMINATION"}
            </p>
          </div>
        </div>
      </div>

      {/* Registration Status or Form */}
      {canRegister ? (
        <div className="space-y-4">
          <div className="space-y-0.5">
            <h2 className="text-xl font-bold tracking-tight">
              Student Team Registration
            </h2>
            <p className="text-xs text-muted-foreground">
              Enter your team details and teammate names below to reserve your spot.
            </p>
          </div>

          <TeamRegisterForm
            tournamentId={tournament.id}
            tournamentName={tournament.name}
            tournamentSlug={tournament.slug}
            gameFormat={tournament.gameFormat}
            standalone={true}
            lang={lang}
          />
        </div>
      ) : isFull ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/80 p-12 text-center bg-card/40 space-y-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-500">
            <Icons.Users className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold">Tournament Bracket Full</h3>
            <p className="text-xs text-muted-foreground max-w-sm">
              All {tournament.maxTeams} team slots have been filled. You can still follow the live bracket matches!
            </p>
          </div>
          <Link
            href={`/${lang}/tournaments/${tournament.slug}`}
            className={cn(buttonVariants({ variant: "default" }), "gap-2 font-bold shadow-md")}
          >
            <Icons.Swords className="h-4 w-4" />
            View Live Bracket & Teams
          </Link>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/80 p-12 text-center bg-card/40 space-y-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <Icons.Close className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold">Registration Closed</h3>
            <p className="text-xs text-muted-foreground max-w-sm">
              This tournament is currently {tournament.status.toLowerCase().replace("_", " ")}. Registration is no longer accepting new team entries.
            </p>
          </div>
          <Link
            href={`/${lang}/tournaments/${tournament.slug}`}
            className={cn(buttonVariants({ variant: "default" }), "gap-2 font-bold shadow-md")}
          >
            <Icons.Swords className="h-4 w-4" />
            View Live Bracket
          </Link>
        </div>
      )}
    </div>
  );
}
