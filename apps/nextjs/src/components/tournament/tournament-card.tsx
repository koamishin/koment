"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@saasfly/ui";
import { Button, buttonVariants } from "@saasfly/ui/button";
import * as Icons from "@saasfly/ui/icons";
import {
  TournamentStatusBadge,
  GameBadge,
  FormatBadge,
  type TournamentStatus,
  type TournamentType,
} from "./tournament-badges";
import { ShareTournamentDialog } from "./share-tournament-dialog";

export interface TournamentCardData {
  id: number;
  name: string;
  slug: string;
  game: string;
  gameFormat?: string;
  tournamentType?: TournamentType;
  status: TournamentStatus;
  prizePool?: string | null;
  maxTeams: number;
  matchType?: string;
  startsAt: Date | string;
  organizationName?: string;
  teamsCount?: number;
}

interface TournamentCardProps {
  tournament: TournamentCardData;
  lang: string;
  manageHref?: string;
  publicHref?: string;
  onRegisterClick?: () => void;
  showShare?: boolean;
  className?: string;
}

export function TournamentCard({
  tournament,
  lang,
  manageHref,
  publicHref,
  onRegisterClick,
  showShare = true,
  className,
}: TournamentCardProps) {
  const [shareOpen, setShareOpen] = React.useState(false);
  const teamsCount = tournament.teamsCount ?? 0;
  const maxTeams = tournament.maxTeams || 16;
  const progressPercent = Math.min(100, Math.round((teamsCount / maxTeams) * 100));
  const isFull = teamsCount >= maxTeams;

  const targetHref =
    manageHref ?? publicHref ?? `/${lang}/tournaments/${tournament.slug}`;

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(tournament.startsAt));

  return (
    <div
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/70 bg-card/60 backdrop-blur-sm transition-all duration-300 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5",
        className,
      )}
    >
      {/* Top Game Banner Accent */}
      <div className="relative h-28 w-full overflow-hidden bg-gradient-to-br from-primary/20 via-purple-600/10 to-muted p-4">
        <div className="flex items-center justify-between">
          <GameBadge game={tournament.game} />
          <TournamentStatusBadge status={tournament.status} />
        </div>

        {tournament.prizePool ? (
          <div className="absolute bottom-3 left-4 flex items-center gap-1.5 rounded-lg bg-background/80 px-2.5 py-1 text-xs font-bold text-amber-500 shadow-sm backdrop-blur-md border border-amber-500/20">
            <Icons.Trophy className="h-3.5 w-3.5" />
            <span>{tournament.prizePool}</span>
          </div>
        ) : null}
      </div>

      {/* Main Body */}
      <div className="flex flex-1 flex-col p-5 space-y-4">
        <div>
          {tournament.organizationName ? (
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              {tournament.organizationName}
            </span>
          ) : null}
          <Link href={targetHref} className="block mt-1">
            <h3 className="text-lg font-bold tracking-tight text-foreground transition-colors group-hover:text-primary line-clamp-1">
              {tournament.name}
            </h3>
          </Link>
        </div>

        <FormatBadge
          type={tournament.tournamentType}
          gameFormat={tournament.gameFormat}
          matchType={tournament.matchType}
        />

        {/* Capacity / Slots Meter */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1">
              <Icons.Users className="h-3.5 w-3.5" />
              Teams Enrolled
            </span>
            <span className="font-mono font-semibold">
              {teamsCount} / {maxTeams}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                isFull
                  ? "bg-rose-500"
                  : progressPercent > 75
                    ? "bg-amber-500"
                    : "bg-primary",
              )}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1 border-t border-border/50">
          <Icons.Calendar className="h-3.5 w-3.5 text-primary/70" />
          <span>{formattedDate}</span>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center gap-2 border-t border-border/60 bg-muted/20 px-4 py-2.5">
        <Link
          href={targetHref}
          className={cn(
            buttonVariants({ variant: "default", size: "sm" }),
            "flex-1 text-xs font-semibold gap-1.5 h-8",
          )}
        >
          <Icons.Swords className="h-3.5 w-3.5" />
          {manageHref ? "Manage Bracket" : "View Bracket"}
        </Link>
        {showShare ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShareOpen(true)}
            className="h-8 px-2.5 text-xs gap-1 shrink-0"
            title="Share registration link or QR code"
          >
            <Icons.QrCode className="h-3.5 w-3.5 text-primary" />
            <span className="hidden sm:inline">QR</span>
          </Button>
        ) : null}
        {onRegisterClick &&
        tournament.status === "REGISTRATION" &&
        !isFull ? (
          <Button
            variant="outline"
            size="sm"
            onClick={onRegisterClick}
            className="text-xs shrink-0 h-8"
          >
            Register
          </Button>
        ) : null}
      </div>

      <ShareTournamentDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        tournament={{
          id: tournament.id,
          name: tournament.name,
          slug: tournament.slug,
          game: tournament.game,
          gameFormat: tournament.gameFormat,
          maxTeams: tournament.maxTeams,
          prizePool: tournament.prizePool,
          startsAt: tournament.startsAt,
          organizationName: tournament.organizationName,
        }}
        lang={lang}
      />
    </div>
  );
}
