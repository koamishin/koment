import Link from "next/link";
import { trpc } from "~/trpc/server";
import { getDictionary } from "~/lib/get-dictionary";
import type { Locale } from "~/config/i18n-config";
import { TournamentCard } from "~/components/tournament/tournament-card";
import { EmptyPlaceholder } from "~/components/empty-placeholder";
import * as Icons from "@saasfly/ui/icons";
import { buttonVariants } from "@saasfly/ui/button";
import { cn } from "@saasfly/ui";

interface TournamentsPageProps {
  params: { lang: Locale };
  searchParams?: { game?: string; search?: string };
}

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Esports Tournaments | KoaTournament",
  description:
    "Explore live esports competitions, interactive brackets, match schedules, and leaderboards.",
};

export default async function TournamentsPage({
  params: { lang },
  searchParams,
}: TournamentsPageProps) {
  const [dict, tournaments] = await Promise.all([
    getDictionary(lang),
    trpc.tournament.listPublic.query({
      game: searchParams?.game,
      search: searchParams?.search,
      limit: 30,
    }).catch(() => []),
  ]);

  return (
    <div className="container py-12 space-y-10">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/20 via-purple-600/10 to-background p-8 md:p-14 shadow-2xl backdrop-blur-xl">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-primary/20 blur-3xl"
        />
        <div className="relative max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <Icons.Trophy className="h-3.5 w-3.5" />
            Competitive Esports Hub
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
            Esports Tournaments
          </h1>
          <p className="text-base text-muted-foreground leading-relaxed">
            Discover student and campus tournaments, track live interactive brackets, check match schedules, and register your squad in seconds.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href={`/${lang}/dashboard/tournaments?action=new`}
              className={cn(
                buttonVariants({ variant: "default" }),
                "gap-2 font-bold shadow-lg shadow-primary/25",
              )}
            >
              <Icons.Add className="h-4 w-4" />
              Host a Tournament
            </Link>
            <Link
              href={`/${lang}/events`}
              className={cn(buttonVariants({ variant: "outline" }), "gap-2")}
            >
              <Icons.Calendar className="h-4 w-4" />
              Browse Live Events
            </Link>
          </div>
        </div>
      </div>

      {/* Student Self-Registration Guide Banner */}
      <div className="rounded-2xl border border-border/80 bg-card/60 p-6 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/60 pb-4 mb-4">
          <div className="space-y-0.5">
            <h3 className="font-bold text-base flex items-center gap-2">
              <Icons.Gamepad className="h-4 w-4 text-primary" />
              How It Works for Students & Players
            </h3>
            <p className="text-xs text-muted-foreground">
              Zero complicated paperwork. Join any open bracket directly from your phone or PC.
            </p>
          </div>
          <span className="text-[11px] font-mono uppercase bg-primary/10 text-primary px-2.5 py-1 rounded-full font-semibold shrink-0">
            Self-Service Entry
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex gap-3 items-start">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary font-bold text-xs font-mono">
              1
            </span>
            <div className="space-y-1">
              <h4 className="text-xs font-bold uppercase tracking-wide">Pick a Tournament</h4>
              <p className="text-xs text-muted-foreground">
                Browse open tournaments below for your game and check the match schedule.
              </p>
            </div>
          </div>

          <div className="flex gap-3 items-start">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-purple-500/15 text-purple-500 font-bold text-xs font-mono">
              2
            </span>
            <div className="space-y-1">
              <h4 className="text-xs font-bold uppercase tracking-wide">Scan QR or Register</h4>
              <p className="text-xs text-muted-foreground">
                Enter your team name, captain tag & Discord handle. Teammates can be added anytime.
              </p>
            </div>
          </div>

          <div className="flex gap-3 items-start">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-500 font-bold text-xs font-mono">
              3
            </span>
            <div className="space-y-1">
              <h4 className="text-xs font-bold uppercase tracking-wide">Play & Track Bracket</h4>
              <p className="text-xs text-muted-foreground">
                Get your digital team pass, show up on match day, and watch live bracket progression.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tournaments Grid */}
      {tournaments.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tournaments.map((t) => (
            <TournamentCard
              key={t.id}
              tournament={t}
              lang={lang}
            />
          ))}
        </div>
      ) : (
        <EmptyPlaceholder>
          <EmptyPlaceholder.Icon name="Gamepad" />
          <EmptyPlaceholder.Title>
            {dict.tournament?.no_tournaments_title ?? "No Tournaments Yet"}
          </EmptyPlaceholder.Title>
          <EmptyPlaceholder.Description>
            {dict.tournament?.no_tournaments_text ??
              "Create your first tournament, seed teams, and generate live brackets."}
          </EmptyPlaceholder.Description>
          <Link
            href={`/${lang}/dashboard/tournaments?action=new`}
            className={cn(buttonVariants({ variant: "outline" }), "mt-4 gap-2")}
          >
            <Icons.Add className="h-4 w-4" />
            Create Your First Tournament
          </Link>
        </EmptyPlaceholder>
      )}
    </div>
  );
}
