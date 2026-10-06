"use client";

import * as React from "react";
import { cn } from "@saasfly/ui";
import * as Icons from "@saasfly/ui/icons";
import {
  MatchScoreDialog,
  type MatchDialogData,
  type TeamLookup,
} from "./match-score-dialog";
import { MatchStatusBadge, type MatchStatus } from "./tournament-badges";

export interface BracketMatch {
  id: number;
  tournamentId: number;
  round: number;
  matchNumber: number;
  stage: string;
  team1Id: number | null;
  team2Id: number | null;
  team1Score: number;
  team2Score: number;
  winnerId: number | null;
  nextMatchId: number | null;
  status: MatchStatus;
  scheduledAt?: Date | string | null;
  vodUrl?: string | null;
}

export interface BracketTeam {
  id: number;
  name: string;
  tag?: string | null;
  logo?: string | null;
  seed?: number | null;
}

interface TournamentBracketProps {
  matches: BracketMatch[];
  teams: BracketTeam[];
  organizationId?: number;
  isOrganizer?: boolean;
  onRefresh?: () => void;
  className?: string;
}

export function TournamentBracket({
  matches,
  teams,
  organizationId,
  isOrganizer = false,
  onRefresh,
  className,
}: TournamentBracketProps) {
  const [selectedMatch, setSelectedMatch] = React.useState<MatchDialogData | null>(
    null,
  );
  const [dialogOpen, setDialogOpen] = React.useState<boolean>(false);

  const teamsMap = React.useMemo(() => {
    const map = new Map<number, TeamLookup>();
    for (const t of teams) {
      map.set(t.id, t);
    }
    return map;
  }, [teams]);

  // Group matches by round
  const rounds = React.useMemo(() => {
    const map = new Map<number, BracketMatch[]>();
    for (const m of matches) {
      const arr = map.get(m.round) ?? [];
      arr.push(m);
      map.set(m.round, arr);
    }
    const sortedRounds = Array.from(map.entries()).sort(([a], [b]) => a - b);
    return sortedRounds.map(([roundNum, roundMatches]) => ({
      roundNum,
      matches: roundMatches.sort((a, b) => a.matchNumber - b.matchNumber),
    }));
  }, [matches]);

  const totalRounds = rounds.length;

  const getRoundTitle = (round: number, total: number) => {
    if (round === total) return "Grand Finals";
    if (round === total - 1) return "Semifinals";
    if (round === total - 2) return "Quarterfinals";
    return `Round ${round}`;
  };

  const grandFinalMatch = rounds.length > 0 ? rounds[rounds.length - 1]?.matches[0] : null;
  const championTeam =
    grandFinalMatch?.winnerId ? teamsMap.get(grandFinalMatch.winnerId) : null;

  if (matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 p-12 text-center bg-card/20">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-4">
          <Icons.Trophy className="h-7 w-7" />
        </div>
        <h3 className="text-lg font-semibold mb-1">Bracket Not Generated</h3>
        <p className="text-sm text-muted-foreground max-w-sm mb-6">
          {isOrganizer
            ? "Add or seed teams, then hit 'Generate Bracket' to launch tournament matches and automated progression."
            : "The tournament organizer has not generated match brackets yet. Check back soon!"}
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Champion banner if grand finals completed */}
      {championTeam ? (
        <div className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/15 via-purple-500/15 to-amber-500/10 p-6 backdrop-blur-sm shadow-lg shadow-amber-500/5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-500 shadow-inner border border-amber-500/30">
                <Icons.Trophy className="h-8 w-8 animate-bounce" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">
                  Tournament Champion
                </span>
                <h2 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                  {championTeam.name}
                  {championTeam.tag ? (
                    <span className="text-sm font-mono text-muted-foreground font-normal">
                      [{championTeam.tag}]
                    </span>
                  ) : null}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Winner of the Grand Finals!
                </p>
              </div>
            </div>
            <div className="rounded-xl border border-border/60 bg-background/60 px-4 py-2 text-center">
              <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground block">
                Final Score
              </span>
              <span className="text-xl font-bold font-mono">
                {grandFinalMatch?.team1Score} - {grandFinalMatch?.team2Score}
              </span>
            </div>
          </div>
        </div>
      ) : null}

      {/* Bracket scroll container */}
      <div className="relative overflow-x-auto pb-6 pt-2">
        <div className="flex items-start gap-8 min-w-max px-2">
          {rounds.map(({ roundNum, matches: roundMatches }) => {
            const title = getRoundTitle(roundNum, totalRounds);
            const isFinals = roundNum === totalRounds;

            return (
              <div
                key={roundNum}
                className="flex flex-col w-72 shrink-0 space-y-4"
              >
                {/* Round Header */}
                <div
                  className={cn(
                    "flex items-center justify-between rounded-lg border px-3.5 py-2 backdrop-blur-sm",
                    isFinals
                      ? "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400"
                      : "border-border/70 bg-card/60 text-muted-foreground",
                  )}
                >
                  <span className="text-xs font-bold uppercase tracking-wider">
                    {title}
                  </span>
                  <span className="text-[11px] font-mono opacity-80">
                    {roundMatches.length} {roundMatches.length === 1 ? "match" : "matches"}
                  </span>
                </div>

                {/* Match List for Round */}
                <div className="flex flex-col justify-around gap-6 h-full py-2">
                  {roundMatches.map((m) => {
                    const t1 = m.team1Id ? teamsMap.get(m.team1Id) : null;
                    const t2 = m.team2Id ? teamsMap.get(m.team2Id) : null;
                    const isT1Winner = m.winnerId !== null && m.winnerId === m.team1Id;
                    const isT2Winner = m.winnerId !== null && m.winnerId === m.team2Id;

                    return (
                      <button
                        type="button"
                        key={m.id}
                        onClick={() => {
                          setSelectedMatch(m);
                          setDialogOpen(true);
                        }}
                        className={cn(
                          "w-full text-left group relative cursor-pointer overflow-hidden rounded-xl border transition-all duration-200 shadow-sm",
                          m.status === "LIVE"
                            ? "border-rose-500/60 bg-gradient-to-br from-rose-500/10 to-card/90 ring-1 ring-rose-500/30 shadow-rose-500/10"
                            : "border-border/70 bg-card/70 hover:border-primary/50 hover:bg-card hover:shadow-md",
                        )}
                      >
                        {/* Match header pill */}
                        <div className="flex items-center justify-between border-b border-border/50 bg-muted/40 px-3 py-1.5 text-[11px]">
                          <span className="font-mono text-muted-foreground font-semibold">
                            M{m.matchNumber}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <MatchStatusBadge status={m.status} />
                            {isOrganizer ? (
                              <Icons.Settings className="h-3 w-3 text-muted-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity" />
                            ) : null}
                          </div>
                        </div>

                        {/* Teams Box */}
                        <div className="divide-y divide-border/40 text-sm">
                          {/* Team 1 */}
                          <div
                            className={cn(
                              "flex items-center justify-between px-3 py-2.5 transition-colors",
                              isT1Winner
                                ? "bg-emerald-500/10 font-semibold text-emerald-600 dark:text-emerald-400"
                                : "text-foreground",
                            )}
                          >
                            <div className="flex items-center gap-2 min-w-0 pr-2">
                              {t1?.seed ? (
                                <span className="text-[10px] font-mono text-muted-foreground w-4">
                                  #{t1.seed}
                                </span>
                              ) : (
                                <span className="w-4 text-[10px] text-muted-foreground/40 font-mono">
                                  -
                                </span>
                              )}
                              <span className="truncate">
                                {t1 ? t1.name : "TBD"}
                              </span>
                              {t1?.tag ? (
                                <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                                  [{t1.tag}]
                                </span>
                              ) : null}
                            </div>
                            <div className="flex items-center gap-1.5">
                              {isT1Winner ? (
                                <Icons.Check className="h-3.5 w-3.5 text-emerald-500" />
                              ) : null}
                              <span
                                className={cn(
                                  "font-mono font-bold text-xs rounded px-1.5 py-0.5",
                                  isT1Winner
                                    ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-300"
                                    : "bg-muted/80 text-muted-foreground",
                                )}
                              >
                                {m.team1Score}
                              </span>
                            </div>
                          </div>

                          {/* Team 2 */}
                          <div
                            className={cn(
                              "flex items-center justify-between px-3 py-2.5 transition-colors",
                              isT2Winner
                                ? "bg-emerald-500/10 font-semibold text-emerald-600 dark:text-emerald-400"
                                : "text-foreground",
                            )}
                          >
                            <div className="flex items-center gap-2 min-w-0 pr-2">
                              {t2?.seed ? (
                                <span className="text-[10px] font-mono text-muted-foreground w-4">
                                  #{t2.seed}
                                </span>
                              ) : (
                                <span className="w-4 text-[10px] text-muted-foreground/40 font-mono">
                                  -
                                </span>
                              )}
                              <span className="truncate">
                                {t2 ? t2.name : "TBD"}
                              </span>
                              {t2?.tag ? (
                                <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                                  [{t2.tag}]
                                </span>
                              ) : null}
                            </div>
                            <div className="flex items-center gap-1.5">
                              {isT2Winner ? (
                                <Icons.Check className="h-3.5 w-3.5 text-emerald-500" />
                              ) : null}
                              <span
                                className={cn(
                                  "font-mono font-bold text-xs rounded px-1.5 py-0.5",
                                  isT2Winner
                                    ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-300"
                                    : "bg-muted/80 text-muted-foreground",
                                )}
                              >
                                {m.team2Score}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Broadcast indicator footer if exists */}
                        {m.vodUrl ? (
                          <div className="border-t border-border/40 bg-muted/20 px-3 py-1 text-[10px] text-primary flex items-center gap-1">
                            <Icons.Play className="h-2.5 w-2.5" />
                            <span>VOD Available</span>
                          </div>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <MatchScoreDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        match={selectedMatch}
        organizationId={organizationId}
        isOrganizer={isOrganizer}
        teamsMap={teamsMap}
        onSaved={onRefresh}
      />
    </div>
  );
}
