"use client";

import * as React from "react";
import { Button } from "@saasfly/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@saasfly/ui/tabs";
import * as Icons from "@saasfly/ui/icons";
import {
  TournamentStatusBadge,
  GameBadge,
  FormatBadge,
  type TournamentStatus,
  type TournamentType,
} from "./tournament-badges";
import { TournamentBracket, type BracketMatch, type BracketTeam } from "./tournament-bracket";
import { TeamRegisterDialog } from "./team-register-dialog";
import { ShareTournamentDialog } from "./share-tournament-dialog";
import { TournamentRosterTable, type RosterTeam } from "./tournament-roster-table";

export interface PublicTournamentData {
  id: number;
  organizationId: number;
  organizationName?: string;
  name: string;
  slug: string;
  description?: string | null;
  game: string;
  gameFormat?: string;
  tournamentType?: TournamentType;
  status: TournamentStatus;
  prizePool?: string | null;
  rules?: string | null;
  maxTeams: number;
  matchType?: string;
  streamUrl?: string | null;
  startsAt: Date | string;
}

interface TournamentPublicViewProps {
  tournament: PublicTournamentData;
  teams: RosterTeam[];
  matches: BracketMatch[];
  lang?: string;
  initialRegisterOpen?: boolean;
}

export function TournamentPublicView({
  tournament,
  teams,
  matches,
  lang = "en",
  initialRegisterOpen = false,
}: TournamentPublicViewProps) {
  const [registerOpen, setRegisterOpen] = React.useState(initialRegisterOpen);
  const [shareOpen, setShareOpen] = React.useState(false);

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(tournament.startsAt));

  const isFull = teams.length >= tournament.maxTeams;
  const canRegister =
    tournament.status === "REGISTRATION" && !isFull;

  return (
    <div className="space-y-8">
      {/* Hero Tournament Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-gradient-to-b from-card/90 via-card/50 to-background p-6 md:p-10 shadow-2xl backdrop-blur-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-4 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <GameBadge game={tournament.game} />
              <TournamentStatusBadge status={tournament.status} />
              <FormatBadge
                type={tournament.tournamentType}
                gameFormat={tournament.gameFormat}
                matchType={tournament.matchType}
              />
            </div>

            <div>
              <span className="text-xs uppercase font-mono tracking-widest text-primary font-bold">
                Hosted by {tournament.organizationName}
              </span>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight text-foreground mt-1">
                {tournament.name}
              </h1>
            </div>

            {tournament.description ? (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {tournament.description}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center gap-6 pt-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Icons.Calendar className="h-4 w-4 text-primary" />
                <span>{formattedDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <Icons.Users className="h-4 w-4 text-primary" />
                <span>
                  {teams.length} / {tournament.maxTeams} Teams Enrolled
                </span>
              </div>
              {tournament.prizePool ? (
                <div className="flex items-center gap-2 font-bold text-amber-500">
                  <Icons.Trophy className="h-4 w-4" />
                  <span>{tournament.prizePool}</span>
                </div>
              ) : null}
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0">
            {tournament.streamUrl ? (
              <a
                href={tournament.streamUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-purple-600/25 transition-all hover:bg-purple-500"
              >
                <Icons.Play className="h-4 w-4" />
                Watch Broadcast
              </a>
            ) : null}

            {canRegister ? (
              <Button
                size="lg"
                onClick={() => setRegisterOpen(true)}
                className="gap-2 rounded-xl font-black shadow-lg shadow-primary/25 text-sm bg-primary hover:bg-primary/90"
              >
                <Icons.Ticket className="h-4 w-4" />
                Register Team
              </Button>
            ) : isFull ? (
              <Button disabled variant="outline" className="rounded-xl">
                Tournament Full ({tournament.maxTeams} teams)
              </Button>
            ) : (
              <Button disabled variant="outline" className="rounded-xl">
                Registration Closed
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShareOpen(true)}
              className="gap-1.5 rounded-xl text-xs font-semibold"
            >
              <Icons.QrCode className="h-3.5 w-3.5" />
              Share / Scan QR
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs Content */}
      <Tabs defaultValue="bracket" className="space-y-6">
        <TabsList className="bg-card/70 border border-border/70 p-1">
          <TabsTrigger value="bracket" className="gap-2 text-xs font-semibold">
            <Icons.Swords className="h-3.5 w-3.5" />
            Live Bracket
          </TabsTrigger>
          <TabsTrigger value="teams" className="gap-2 text-xs font-semibold">
            <Icons.Users className="h-3.5 w-3.5" />
            Teams ({teams.length})
          </TabsTrigger>
          <TabsTrigger value="rules" className="gap-2 text-xs font-semibold">
            <Icons.Page className="h-3.5 w-3.5" />
            Rules & Format
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bracket" className="space-y-4">
          <TournamentBracket
            matches={matches}
            teams={teams as BracketTeam[]}
            isOrganizer={false}
          />
        </TabsContent>

        <TabsContent value="teams" className="space-y-4">
          <TournamentRosterTable
            teams={teams}
            organizationId={tournament.organizationId}
            tournamentId={tournament.id}
            isOrganizer={false}
          />
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          <div className="rounded-2xl border border-border/70 bg-card/40 p-6 space-y-4">
            <h3 className="text-lg font-bold">Tournament Format & Rules</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-y border-border/50 py-4">
              <div>
                <span className="text-xs text-muted-foreground uppercase font-mono">
                  Bracket System
                </span>
                <p className="font-semibold text-sm mt-0.5">
                  {tournament.tournamentType}
                </p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground uppercase font-mono">
                  Game Format
                </span>
                <p className="font-semibold text-sm mt-0.5">
                  {tournament.gameFormat}
                </p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground uppercase font-mono">
                  Match Series
                </span>
                <p className="font-semibold text-sm mt-0.5">
                  {tournament.matchType}
                </p>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-2">Official Rules</h4>
              {tournament.rules ? (
                <div className="rounded-xl bg-muted/40 p-4 text-xs font-mono text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {tournament.rules}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Standard competitive rules apply for {tournament.game}. Check with the tournament organizer for lobby codes and scheduling.
                </p>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

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

      <TeamRegisterDialog
        open={registerOpen}
        onOpenChange={setRegisterOpen}
        tournamentId={tournament.id}
        tournamentName={tournament.name}
        tournamentSlug={tournament.slug}
        gameFormat={tournament.gameFormat}
        lang={lang}
      />
    </div>
  );
}
