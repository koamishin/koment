import Link from "next/link";
import { Badge } from "@saasfly/ui/badge";
import { buttonVariants } from "@saasfly/ui/button";
import { cn } from "@saasfly/ui";
import * as Icons from "@saasfly/ui/icons";

import { QrPass } from "~/components/event/qr-pass";
import { GameBadge, TournamentStatusBadge, type TournamentStatus } from "./tournament-badges";
import type { Locale } from "~/config/i18n-config";

export interface TournamentPassData {
  teamId: number;
  teamName: string;
  teamTag: string | null;
  captainName: string;
  captainEmail: string;
  captainDiscord: string | null;
  seed: number | null;
  teamStatus: string;
  checkInCode: string;
  registeredAt: Date | string;
  tournamentId: number;
  tournamentName: string;
  tournamentSlug: string;
  game: string;
  gameFormat: string;
  tournamentType: string;
  matchType: string;
  tournamentStatus: string;
  prizePool: string | null;
  startsAt: Date | string;
  organizationName: string;
  organizationSlug: string;
}

interface TournamentPassCardProps {
  pass: TournamentPassData;
  lang: Locale;
}

export function TournamentPassCard({ pass, lang }: TournamentPassCardProps) {
  const isPast =
    pass.tournamentStatus === "COMPLETED" ||
    pass.tournamentStatus === "CANCELED" ||
    new Date(pass.startsAt).getTime() < Date.now();
  const isCheckedIn = pass.teamStatus === "CHECKED_IN";

  const formattedDate = new Date(pass.startsAt).toLocaleDateString(lang, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <article
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5",
        isPast && "opacity-75",
      )}
    >
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/20 via-purple-600/10 to-transparent p-5">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-primary/20 blur-3xl"
        />
        <div className="relative space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {pass.organizationName}
              </p>
              <h3 className="truncate font-heading text-lg font-semibold leading-tight">
                {pass.tournamentName}
              </h3>
            </div>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-background/60 text-primary">
              <Icons.Swords className="h-5 w-5" />
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <GameBadge game={pass.game} />
            <TournamentStatusBadge status={pass.tournamentStatus as TournamentStatus} />
            {isCheckedIn ? (
              <Badge variant="success" className="gap-1">
                <Icons.Check className="h-3 w-3" />
                Checked In
              </Badge>
            ) : null}
            {pass.seed ? (
              <Badge variant="outline" className="font-mono text-xs">
                Seed #{pass.seed}
              </Badge>
            ) : null}
          </div>

          {/* Team Box */}
          <div className="rounded-xl border border-border/60 bg-background/70 p-3 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Team Roster</span>
              {pass.teamTag ? (
                <span className="font-mono text-[10px] uppercase font-bold text-primary">
                  [{pass.teamTag}]
                </span>
              ) : null}
            </div>
            <p className="font-bold text-sm text-foreground">{pass.teamName}</p>
            <p className="text-xs text-muted-foreground">
              Captain: {pass.captainName} ({pass.captainEmail})
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 pt-1 text-sm">
            <div className="col-span-2 flex items-center gap-2">
              <Icons.Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <dt className="sr-only">Starts At</dt>
              <dd className="text-xs text-muted-foreground">{formattedDate}</dd>
            </div>
            {pass.prizePool ? (
              <div className="col-span-2 flex items-center gap-2">
                <Icons.Trophy className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                <dt className="sr-only">Prize Pool</dt>
                <dd className="text-xs font-semibold text-amber-500">
                  {pass.prizePool}
                </dd>
              </div>
            ) : null}
          </dl>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-end gap-3 p-5 pt-3">
        {pass.checkInCode ? (
          <div className="flex items-center justify-between rounded-xl border border-dashed border-border/80 bg-muted/30 p-2.5">
            <div className="space-y-0.5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
                Team Pass Code
              </p>
              <p className="font-mono text-sm font-bold tracking-wider text-foreground">
                {pass.checkInCode}
              </p>
            </div>
            <div className="rounded-lg bg-white p-1.5 shadow-sm">
              <QrPass
                code={pass.checkInCode}
                size={54}
                className="rounded overflow-hidden"
              />
            </div>
          </div>
        ) : null}

        <div className="flex items-center gap-2 pt-1">
          <Link
            href={`/${lang}/tournaments/${pass.tournamentSlug}`}
            className={cn(
              buttonVariants({ variant: "default", size: "sm" }),
              "w-full gap-2 text-xs font-semibold shadow-sm",
            )}
          >
            <Icons.Swords className="h-3.5 w-3.5" />
            Live Bracket & Matches
          </Link>
        </div>
      </div>
    </article>
  );
}
