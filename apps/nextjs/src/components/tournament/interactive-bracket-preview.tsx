"use client";

import * as React from "react";
import { cn } from "@saasfly/ui";
import { Button } from "@saasfly/ui/button";
import { Badge } from "@saasfly/ui/badge";
import * as Icons from "@saasfly/ui/icons";

interface DemoMatch {
  id: string;
  round: number;
  matchNumber: number;
  t1: { name: string; tag: string; score: number };
  t2: { name: string; tag: string; score: number };
  winner: 1 | 2 | null;
  status: "LIVE" | "FINAL" | "SCHEDULED";
}

const INITIAL_MATCHES: DemoMatch[] = [
  // Round 1 - Quarterfinals
  {
    id: "r1-m1",
    round: 1,
    matchNumber: 1,
    t1: { name: "Sentinels", tag: "SEN", score: 2 },
    t2: { name: "Cloud9", tag: "C9", score: 1 },
    winner: 1,
    status: "FINAL",
  },
  {
    id: "r1-m2",
    round: 1,
    matchNumber: 2,
    t1: { name: "Fnatic", tag: "FNC", score: 2 },
    t2: { name: "Team Liquid", tag: "TL", score: 0 },
    winner: 1,
    status: "FINAL",
  },
  {
    id: "r1-m3",
    round: 1,
    matchNumber: 3,
    t1: { name: "Paper Rex", tag: "PRX", score: 2 },
    t2: { name: "Gen.G Esports", tag: "GEN", score: 1 },
    winner: 1,
    status: "FINAL",
  },
  {
    id: "r1-m4",
    round: 1,
    matchNumber: 4,
    t1: { name: "T1 Esports", tag: "T1", score: 1 },
    t2: { name: "Natus Vincere", tag: "NAVI", score: 2 },
    winner: 2,
    status: "FINAL",
  },
  // Round 2 - Semifinals
  {
    id: "r2-m1",
    round: 2,
    matchNumber: 1,
    t1: { name: "Sentinels", tag: "SEN", score: 2 },
    t2: { name: "Fnatic", tag: "FNC", score: 1 },
    winner: 1,
    status: "FINAL",
  },
  {
    id: "r2-m2",
    round: 2,
    matchNumber: 2,
    t1: { name: "Paper Rex", tag: "PRX", score: 1 },
    t2: { name: "Natus Vincere", tag: "NAVI", score: 2 },
    winner: 2,
    status: "FINAL",
  },
  // Round 3 - Grand Finals
  {
    id: "r3-m1",
    round: 3,
    matchNumber: 1,
    t1: { name: "Sentinels", tag: "SEN", score: 3 },
    t2: { name: "Natus Vincere", tag: "NAVI", score: 2 },
    winner: 1,
    status: "FINAL",
  },
];

export function InteractiveBracketPreview() {
  const [matches, setMatches] = React.useState<DemoMatch[]>(INITIAL_MATCHES);

  const toggleWinner = (matchId: string, winnerSlot: 1 | 2) => {
    setMatches((prev) =>
      prev.map((m) => {
        if (m.id !== matchId) return m;
        const newWinner = m.winner === winnerSlot ? null : winnerSlot;
        const newT1Score =
          newWinner === 1 ? Math.max(m.t1.score, m.t2.score + 1) : m.t1.score;
        const newT2Score =
          newWinner === 2 ? Math.max(m.t2.score, m.t1.score + 1) : m.t2.score;
        return {
          ...m,
          winner: newWinner,
          t1: { ...m.t1, score: newT1Score },
          t2: { ...m.t2, score: newT2Score },
          status: newWinner ? "FINAL" : "LIVE",
        };
      }),
    );
  };

  const finals = matches.find((m) => m.id === "r3-m1");
  const champion =
    finals?.winner === 1 ? finals.t1 : finals?.winner === 2 ? finals.t2 : null;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-card/60 p-6 backdrop-blur-xl shadow-2xl shadow-primary/10">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
              Live Bracket Simulation
            </span>
          </div>
          <h4 className="text-xl font-black tracking-tight text-foreground flex items-center gap-2">
            VALORANT Champions Invitational
            <Badge variant="outline" className="font-mono text-xs text-amber-500 border-amber-500/30">
              $50,000 Prize Pool
            </Badge>
          </h4>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground hidden md:inline">
            Interactive: click score pill to toggle winner
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setMatches(INITIAL_MATCHES)}
            className="text-xs gap-1.5 h-8"
          >
            <Icons.Shuffle className="h-3 w-3" />
            Reset Bracket
          </Button>
        </div>
      </div>

      {/* Champion Callout */}
      {champion ? (
        <div className="mt-4 flex items-center justify-between rounded-xl bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-primary/20 border border-amber-500/40 p-3 text-sm">
          <div className="flex items-center gap-2">
            <Icons.Crown className="h-5 w-5 text-amber-400 animate-bounce" />
            <span className="font-bold text-foreground">
              Grand Champion: {champion.name} [{champion.tag}]
            </span>
          </div>
          <span className="text-xs font-mono text-amber-500 font-semibold uppercase">
            Took 1st Place • $30,000
          </span>
        </div>
      ) : null}

      {/* Horizontal Bracket Tree */}
      <div className="overflow-x-auto pt-6 pb-2">
        <div className="flex items-center gap-8 min-w-[760px]">
          {/* Round 1: Quarterfinals */}
          <div className="flex-1 space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground text-center bg-muted/40 py-1 rounded-md border border-border/50">
              Quarterfinals (BO3)
            </div>
            <div className="space-y-4">
              {matches
                .filter((m) => m.round === 1)
                .map((m) => (
                  <div
                    key={m.id}
                    className="overflow-hidden rounded-xl border border-border/70 bg-background/80 shadow-sm transition-all hover:border-primary/50"
                  >
                    <div className="flex items-center justify-between border-b border-border/50 bg-muted/30 px-3 py-1 text-[10px] font-mono text-muted-foreground">
                      <span>M{m.matchNumber}</span>
                      <span className="text-emerald-500 font-semibold">FINAL</span>
                    </div>
                    <div className="divide-y divide-border/40 text-xs">
                      <button
                        type="button"
                        onClick={() => toggleWinner(m.id, 1)}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2 cursor-pointer transition-colors text-left",
                          m.winner === 1
                            ? "bg-emerald-500/10 font-bold text-emerald-600 dark:text-emerald-400"
                            : "hover:bg-muted/40",
                        )}
                      >
                        <span className="truncate">{m.t1.name}</span>
                        <span className="font-mono px-1.5 py-0.5 rounded bg-muted/80">
                          {m.t1.score}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleWinner(m.id, 2)}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2 cursor-pointer transition-colors text-left",
                          m.winner === 2
                            ? "bg-emerald-500/10 font-bold text-emerald-600 dark:text-emerald-400"
                            : "hover:bg-muted/40",
                        )}
                      >
                        <span className="truncate">{m.t2.name}</span>
                        <span className="font-mono px-1.5 py-0.5 rounded bg-muted/80">
                          {m.t2.score}
                        </span>
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Round 2: Semifinals */}
          <div className="flex-1 space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground text-center bg-muted/40 py-1 rounded-md border border-border/50">
              Semifinals (BO3)
            </div>
            <div className="flex flex-col justify-around h-full space-y-12 py-6">
              {matches
                .filter((m) => m.round === 2)
                .map((m) => (
                  <div
                    key={m.id}
                    className="overflow-hidden rounded-xl border border-border/70 bg-background/80 shadow-sm transition-all hover:border-primary/50"
                  >
                    <div className="flex items-center justify-between border-b border-border/50 bg-muted/30 px-3 py-1 text-[10px] font-mono text-muted-foreground">
                      <span>M{m.matchNumber}</span>
                      <span className="text-emerald-500 font-semibold">FINAL</span>
                    </div>
                    <div className="divide-y divide-border/40 text-xs">
                      <button
                        type="button"
                        onClick={() => toggleWinner(m.id, 1)}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2.5 cursor-pointer transition-colors text-left",
                          m.winner === 1
                            ? "bg-emerald-500/10 font-bold text-emerald-600 dark:text-emerald-400"
                            : "hover:bg-muted/40",
                        )}
                      >
                        <span className="truncate">{m.t1.name}</span>
                        <span className="font-mono px-1.5 py-0.5 rounded bg-muted/80">
                          {m.t1.score}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleWinner(m.id, 2)}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2.5 cursor-pointer transition-colors text-left",
                          m.winner === 2
                            ? "bg-emerald-500/10 font-bold text-emerald-600 dark:text-emerald-400"
                            : "hover:bg-muted/40",
                        )}
                      >
                        <span className="truncate">{m.t2.name}</span>
                        <span className="font-mono px-1.5 py-0.5 rounded bg-muted/80">
                          {m.t2.score}
                        </span>
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Round 3: Grand Finals */}
          <div className="flex-1 space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-amber-500 text-center bg-amber-500/10 py-1 rounded-md border border-amber-500/30">
              Grand Finals (BO5)
            </div>
            <div className="flex flex-col justify-center h-full py-16">
              {matches
                .filter((m) => m.round === 3)
                .map((m) => (
                  <div
                    key={m.id}
                    className="overflow-hidden rounded-2xl border-2 border-amber-500/40 bg-gradient-to-b from-card to-background shadow-xl shadow-amber-500/5 transition-all hover:border-amber-500"
                  >
                    <div className="flex items-center justify-between border-b border-amber-500/20 bg-amber-500/10 px-3.5 py-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                      <span className="flex items-center gap-1 font-mono">
                        <Icons.Trophy className="h-3.5 w-3.5" />
                        Championship Match
                      </span>
                      <span className="font-mono">FINAL</span>
                    </div>
                    <div className="divide-y divide-border/40 text-sm">
                      <button
                        type="button"
                        onClick={() => toggleWinner(m.id, 1)}
                        className={cn(
                          "w-full flex items-center justify-between px-4 py-3 cursor-pointer transition-colors text-left",
                          m.winner === 1
                            ? "bg-emerald-500/15 font-black text-emerald-600 dark:text-emerald-400"
                            : "hover:bg-muted/40",
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-muted-foreground">
                            [{m.t1.tag}]
                          </span>
                          <span className="font-bold">{m.t1.name}</span>
                        </div>
                        <span className="font-mono font-bold text-base px-2 py-0.5 rounded bg-muted">
                          {m.t1.score}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleWinner(m.id, 2)}
                        className={cn(
                          "w-full flex items-center justify-between px-4 py-3 cursor-pointer transition-colors text-left",
                          m.winner === 2
                            ? "bg-emerald-500/15 font-black text-emerald-600 dark:text-emerald-400"
                            : "hover:bg-muted/40",
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-muted-foreground">
                            [{m.t2.tag}]
                          </span>
                          <span className="font-bold">{m.t2.name}</span>
                        </div>
                        <span className="font-mono font-bold text-base px-2 py-0.5 rounded bg-muted">
                          {m.t2.score}
                        </span>
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
