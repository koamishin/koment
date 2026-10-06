"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@saasfly/ui/table";
import { Button } from "@saasfly/ui/button";
import { Input } from "@saasfly/ui/input";
import { Badge } from "@saasfly/ui/badge";
import { toast } from "@saasfly/ui/use-toast";
import * as Icons from "@saasfly/ui/icons";
import { trpc } from "~/trpc/client";
import { TeamRegisterDialog } from "./team-register-dialog";

export interface RosterTeam {
  id: number;
  name: string;
  tag: string | null;
  logo: string | null;
  captainName: string;
  captainEmail: string;
  captainDiscord: string | null;
  seed: number | null;
  players: unknown;
  status: string;
  createdAt: Date | string;
}

interface TournamentRosterTableProps {
  teams: RosterTeam[];
  organizationId: number;
  tournamentId?: number;
  tournamentName?: string;
  gameFormat?: string;
  isOrganizer?: boolean;
  onRefresh?: () => void;
}

export function TournamentRosterTable({
  teams,
  organizationId,
  tournamentId,
  tournamentName = "Tournament",
  gameFormat = "5v5",
  isOrganizer = false,
  onRefresh,
}: TournamentRosterTableProps) {
  const router = useRouter();
  const [addTeamOpen, setAddTeamOpen] = React.useState<boolean>(false);
  const [editingSeedTeamId, setEditingSeedTeamId] = React.useState<number | null>(
    null,
  );
  const [seedVal, setSeedVal] = React.useState<number>(1);
  const [loading, setLoading] = React.useState<boolean>(false);

  const handleUpdateSeed = async (teamId: number) => {
    try {
      setLoading(true);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      await trpc.tournament.updateTeamSeed.mutate({
        organizationId,
        teamId,
        seed: Number(seedVal),
      });
      toast({
        title: "Seed updated",
        description: `Team seed set to #${seedVal}.`,
      });
      setEditingSeedTeamId(null);
      onRefresh?.();
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update seed.";
      toast({
        title: "Error",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTeam = async (teamId: number, teamName: string) => {
    if (!confirm(`Are you sure you want to remove ${teamName} from the tournament?`)) {
      return;
    }
    try {
      setLoading(true);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      await trpc.tournament.deleteTeam.mutate({
        organizationId,
        teamId,
      });
      toast({
        title: "Team removed",
        description: `${teamName} has been removed.`,
      });
      onRefresh?.();
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to remove team.";
      toast({
        title: "Error",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (teams.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 p-8 text-center bg-card/30">
          <Icons.Users className="h-10 w-10 text-muted-foreground/60 mb-3" />
          <h4 className="text-base font-semibold">No Teams Registered Yet</h4>
          <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4">
            Add competing teams directly or share the public tournament link for captain self-registration.
          </p>
          {isOrganizer && tournamentId ? (
            <Button
              onClick={() => setAddTeamOpen(true)}
              className="gap-1.5 text-xs font-semibold shadow-sm"
            >
              <Icons.Add className="h-4 w-4" />
              Add First Team
            </Button>
          ) : null}
        </div>
        {tournamentId ? (
          <TeamRegisterDialog
            open={addTeamOpen}
            onOpenChange={setAddTeamOpen}
            tournamentId={tournamentId}
            tournamentName={tournamentName}
            gameFormat={gameFormat}
            onSuccess={() => {
              onRefresh?.();
              router.refresh();
            }}
          />
        ) : null}
      </>
    );
  }

  return (
    <div className="space-y-3">
      {isOrganizer && tournamentId ? (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Teams enrolled: <span className="font-bold text-foreground">{teams.length}</span>
          </p>
          <Button
            size="sm"
            onClick={() => setAddTeamOpen(true)}
            className="gap-1.5 text-xs font-semibold shadow-sm h-8"
          >
            <Icons.Add className="h-3.5 w-3.5" />
            Add Team
          </Button>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-border/70 bg-card/40">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-16">Seed</TableHead>
            <TableHead>Team</TableHead>
            <TableHead>Captain</TableHead>
            <TableHead className="hidden md:table-cell">Contact</TableHead>
            <TableHead className="hidden lg:table-cell">Teammates</TableHead>
            <TableHead>Status</TableHead>
            {isOrganizer ? (
              <TableHead className="text-right">Actions</TableHead>
            ) : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {teams.map((team) => {
            let playerList: { name: string; role?: string }[] = [];
            if (typeof team.players === "string") {
              try {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                playerList = JSON.parse(team.players);
              } catch {
                playerList = [];
              }
            } else if (Array.isArray(team.players)) {
              playerList = team.players as { name: string; role?: string }[];
            }

            return (
              <TableRow key={team.id} className="group">
                <TableCell>
                  {isOrganizer && editingSeedTeamId === team.id ? (
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min="1"
                        max="128"
                        value={seedVal}
                        onChange={(e) => setSeedVal(Number(e.target.value))}
                        className="h-7 w-14 font-mono text-xs px-1 text-center"
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleUpdateSeed(team.id)}
                        disabled={loading}
                        className="h-7 px-1 text-xs"
                      >
                        ✓
                      </Button>
                    </div>
                  ) : isOrganizer ? (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingSeedTeamId(team.id);
                        setSeedVal(team.seed ?? 1);
                      }}
                      className="cursor-pointer font-mono font-bold text-xs text-primary hover:underline text-left"
                      title="Click to change seed"
                    >
                      #{team.seed ?? "-"}
                    </button>
                  ) : (
                    <span className="font-mono font-bold text-xs">
                      #{team.seed ?? "-"}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">
                      {team.name}
                    </span>
                    {team.tag ? (
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {team.tag}
                      </Badge>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col text-xs">
                    <span className="font-medium text-foreground">
                      {team.captainName}
                    </span>
                    <span className="text-muted-foreground text-[11px]">
                      {team.captainEmail}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell text-xs font-mono text-muted-foreground">
                  {team.captainDiscord ?? "-"}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {playerList.length > 0 ? (
                    <div className="flex flex-wrap gap-1 max-w-xs">
                      {playerList.map((p, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground font-medium"
                        >
                          {p.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Solo / Standard
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-[10px]">
                    {team.status}
                  </Badge>
                </TableCell>
                {isOrganizer ? (
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteTeam(team.id, team.name)}
                      disabled={loading}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      title="Remove team"
                    >
                      <Icons.Trash className="h-4 w-4" />
                    </Button>
                  </TableCell>
                ) : null}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
      {tournamentId ? (
        <TeamRegisterDialog
          open={addTeamOpen}
          onOpenChange={setAddTeamOpen}
          tournamentId={tournamentId}
          tournamentName={tournamentName}
          gameFormat={gameFormat}
          onSuccess={() => {
            onRefresh?.();
            router.refresh();
          }}
        />
      ) : null}
    </div>
  );
}
