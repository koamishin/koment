"use client";

import * as React from "react";
import { Badge } from "@saasfly/ui/badge";
import { cn } from "@saasfly/ui";
import * as Icons from "@saasfly/ui/icons";

export type TournamentStatus =
  | "DRAFT"
  | "REGISTRATION"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELED";

export type MatchStatus = "PENDING" | "SCHEDULED" | "LIVE" | "COMPLETED";

export type TournamentType =
  | "SINGLE_ELIMINATION"
  | "DOUBLE_ELIMINATION"
  | "ROUND_ROBIN"
  | "SWISS";

export function TournamentStatusBadge({
  status,
  className,
}: {
  status: TournamentStatus;
  className?: string;
}) {
  switch (status) {
    case "IN_PROGRESS":
      return (
        <Badge
          className={cn(
            "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 gap-1.5 font-medium",
            className,
          )}
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          Live In Progress
        </Badge>
      );
    case "REGISTRATION":
      return (
        <Badge
          className={cn(
            "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 gap-1.5 font-medium",
            className,
          )}
        >
          <Icons.Ticket className="h-3 w-3" />
          Registration Open
        </Badge>
      );
    case "COMPLETED":
      return (
        <Badge
          className={cn(
            "bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30 gap-1.5 font-medium",
            className,
          )}
        >
          <Icons.Trophy className="h-3 w-3" />
          Completed
        </Badge>
      );
    case "CANCELED":
      return (
        <Badge
          variant="destructive"
          className={cn("gap-1.5 font-medium", className)}
        >
          <Icons.Close className="h-3 w-3" />
          Canceled
        </Badge>
      );
    case "DRAFT":
    default:
      return (
        <Badge
          variant="outline"
          className={cn("text-muted-foreground gap-1.5 font-medium", className)}
        >
          <Icons.Clock className="h-3 w-3" />
          Draft
        </Badge>
      );
  }
}

export function MatchStatusBadge({
  status,
  className,
}: {
  status: MatchStatus;
  className?: string;
}) {
  switch (status) {
    case "LIVE":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500 text-white shadow-sm shadow-rose-500/40",
            className,
          )}
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
          </span>
          Live
        </span>
      );
    case "COMPLETED":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground border border-border/60",
            className,
          )}
        >
          Final
        </span>
      );
    case "SCHEDULED":
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20",
            className,
          )}
        >
          Scheduled
        </span>
      );
    case "PENDING":
    default:
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted/60 text-muted-foreground/70",
            className,
          )}
        >
          TBD
        </span>
      );
  }
}

export function GameBadge({
  game,
  className,
}: {
  game: string;
  className?: string;
}) {
  const normalized = game.toLowerCase();
  let toneClass = "bg-primary/10 text-primary border-primary/20";

  if (normalized.includes("valorant")) {
    toneClass = "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30";
  } else if (normalized.includes("league") || normalized.includes("lol")) {
    toneClass = "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30";
  } else if (normalized.includes("cs") || normalized.includes("counter")) {
    toneClass = "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30";
  } else if (normalized.includes("rocket")) {
    toneClass = "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30";
  } else if (normalized.includes("dota")) {
    toneClass = "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30";
  } else if (normalized.includes("smash")) {
    toneClass = "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/30";
  } else if (normalized.includes("apex")) {
    toneClass = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-semibold tracking-wide",
        toneClass,
        className,
      )}
    >
      <Icons.Gamepad className="h-3.5 w-3.5" />
      {game}
    </span>
  );
}

export function FormatBadge({
  type,
  gameFormat,
  matchType,
  className,
}: {
  type?: TournamentType;
  gameFormat?: string;
  matchType?: string;
  className?: string;
}) {
  const typeLabel =
    type === "SINGLE_ELIMINATION"
      ? "Single Elim"
      : type === "DOUBLE_ELIMINATION"
        ? "Double Elim"
        : type === "ROUND_ROBIN"
          ? "Round Robin"
          : type === "SWISS"
            ? "Swiss"
            : type ?? "Bracket";

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      <Badge variant="secondary" className="text-[11px] font-medium">
        {typeLabel}
      </Badge>
      {gameFormat ? (
        <Badge variant="outline" className="text-[11px]">
          {gameFormat}
        </Badge>
      ) : null}
      {matchType ? (
        <Badge variant="outline" className="text-[11px] font-mono">
          {matchType}
        </Badge>
      ) : null}
    </div>
  );
}
