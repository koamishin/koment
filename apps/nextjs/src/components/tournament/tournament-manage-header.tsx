"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@saasfly/ui/button";
import { toast } from "@saasfly/ui/use-toast";
import * as Icons from "@saasfly/ui/icons";
import { trpc } from "~/trpc/client";
import { TournamentFormDialog, type TournamentEditData } from "./tournament-form-dialog";
import {
  TournamentStatusBadge,
  GameBadge,
  FormatBadge,
  type TournamentStatus,
  type TournamentType,
} from "./tournament-badges";

export interface ManageHeaderTournament {
  id: number;
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
  coverImage?: string | null;
  streamUrl?: string | null;
  startsAt: Date | string;
  endsAt?: Date | string | null;
  isPublic: boolean;
}

import { ShareTournamentDialog } from "./share-tournament-dialog";

interface TournamentManageHeaderProps {
  organizationId: number;
  tournament: ManageHeaderTournament;
  teamsCount: number;
  hasMatches: boolean;
  lang: string;
}

export function TournamentManageHeader({
  organizationId,
  tournament,
  teamsCount,
  hasMatches,
  lang,
}: TournamentManageHeaderProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = React.useState(false);
  const [shareOpen, setShareOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const handleGenerateBracket = async () => {
    if (teamsCount < 2) {
      toast({
        title: "More teams needed",
        description: "Register at least 2 teams before generating tournament matches.",
        variant: "destructive",
      });
      return;
    }

    if (
      hasMatches &&
      !confirm("Regenerating the bracket will wipe current match scores. Continue?")
    ) {
      return;
    }

    try {
      setLoading(true);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const res = (await trpc.tournament.generateBracket.mutate({
        organizationId,
        tournamentId: tournament.id,
      })) as { success: boolean; bracketSize: number; totalRounds: number };

      toast({
        title: "Bracket Generated!",
        description: `Created single elimination bracket with ${res.bracketSize} slots and ${res.totalRounds} rounds.`,
      });

      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to generate bracket.";
      toast({
        title: "Error",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetBracket = async () => {
    if (!confirm("Are you sure you want to reset and clear all bracket matches?")) {
      return;
    }

    try {
      setLoading(true);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      await trpc.tournament.resetBracket.mutate({
        organizationId,
        tournamentId: tournament.id,
      });

      toast({
        title: "Bracket Reset",
        description: "All matches have been cleared. Tournament moved back to Registration.",
      });

      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to reset bracket.";
      toast({
        title: "Error",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/${lang}/tournaments/${tournament.slug}`;
    void navigator.clipboard.writeText(url);
    toast({
      title: "Link Copied!",
      description: "Public tournament URL copied to clipboard.",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <GameBadge game={tournament.game} />
            <TournamentStatusBadge status={tournament.status} />
            <FormatBadge
              type={tournament.tournamentType}
              gameFormat={tournament.gameFormat}
              matchType={tournament.matchType}
            />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">
            {tournament.name}
          </h1>
          {tournament.description ? (
            <p className="text-sm text-muted-foreground max-w-2xl">
              {tournament.description}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={() => setShareOpen(true)}
            className="gap-1.5 text-xs font-bold shadow-md bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white"
          >
            <Icons.QrCode className="h-3.5 w-3.5" />
            Share & QR Code
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            className="gap-1.5 text-xs"
          >
            <Icons.Copy className="h-3.5 w-3.5" />
            Copy Link
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditOpen(true)}
            className="gap-1.5 text-xs"
          >
            <Icons.Settings className="h-3.5 w-3.5" />
            Edit
          </Button>

          {hasMatches ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetBracket}
              disabled={loading}
              className="gap-1.5 text-xs text-rose-500 hover:text-rose-600"
            >
              <Icons.Close className="h-3.5 w-3.5" />
              Reset Bracket
            </Button>
          ) : null}

          <Button
            size="sm"
            onClick={handleGenerateBracket}
            disabled={loading}
            className="gap-1.5 text-xs font-semibold bg-primary shadow-sm"
          >
            {loading ? (
              <Icons.Spinner className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Icons.Swords className="h-3.5 w-3.5" />
            )}
            {hasMatches ? "Regenerate Bracket" : "Generate Bracket"}
          </Button>
        </div>
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
        }}
        lang={lang}
      />

      <TournamentFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        organizationId={organizationId}
        tournament={tournament as TournamentEditData}
      />
    </div>
  );
}
