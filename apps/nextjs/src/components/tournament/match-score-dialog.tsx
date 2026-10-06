"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@saasfly/ui/dialog";
import { Button } from "@saasfly/ui/button";
import { Input } from "@saasfly/ui/input";
import { Label } from "@saasfly/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@saasfly/ui/select";
import { toast } from "@saasfly/ui/use-toast";
import * as Icons from "@saasfly/ui/icons";
import { trpc } from "~/trpc/client";
import type { MatchStatus } from "./tournament-badges";

export interface MatchDialogData {
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
  status: MatchStatus;
  scheduledAt?: Date | string | null;
  vodUrl?: string | null;
}

export interface TeamLookup {
  id: number;
  name: string;
  tag?: string | null;
  logo?: string | null;
  seed?: number | null;
}

interface MatchScoreDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  match: MatchDialogData | null;
  organizationId?: number;
  isOrganizer?: boolean;
  teamsMap: Map<number, TeamLookup>;
  onSaved?: () => void;
}

export function MatchScoreDialog({
  open,
  onOpenChange,
  match,
  organizationId,
  isOrganizer = false,
  teamsMap,
  onSaved,
}: MatchScoreDialogProps) {
  const router = useRouter();
  const [team1Score, setTeam1Score] = React.useState<number>(0);
  const [team2Score, setTeam2Score] = React.useState<number>(0);
  const [winnerId, setWinnerId] = React.useState<string>("auto");
  const [status, setStatus] = React.useState<MatchStatus>("SCHEDULED");
  const [vodUrl, setVodUrl] = React.useState<string>("");
  const [loading, setLoading] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (match) {
      setTeam1Score(match.team1Score ?? 0);
      setTeam2Score(match.team2Score ?? 0);
      setWinnerId(match.winnerId ? String(match.winnerId) : "auto");
      setStatus(match.status ?? "SCHEDULED");
      setVodUrl(match.vodUrl ?? "");
    }
  }, [match]);

  if (!match) return null;

  const team1 = match.team1Id ? teamsMap.get(match.team1Id) : null;
  const team2 = match.team2Id ? teamsMap.get(match.team2Id) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationId) return;

    try {
      setLoading(true);
      const chosenWinnerId =
        winnerId === "auto"
          ? team1Score > team2Score && team1
            ? team1.id
            : team2Score > team1Score && team2
              ? team2.id
              : null
          : winnerId === "none"
            ? null
            : Number(winnerId);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      await trpc.tournament.updateMatch.mutate({
        organizationId,
        matchId: match.id,
        team1Score: Number(team1Score),
        team2Score: Number(team2Score),
        winnerId: chosenWinnerId,
        status: status,
        vodUrl: vodUrl.trim() ? vodUrl.trim() : null,
      });

      toast({
        title: "Match Updated",
        description: `Match scores recorded. ${chosenWinnerId ? "Winner advanced to next round!" : ""}`,
      });

      onOpenChange(false);
      onSaved?.();
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update match.";
      toast({
        title: "Error",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
              Round {match.round} - Match #{match.matchNumber}
            </span>
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-mono">
              {match.stage}
            </span>
          </div>
          <DialogTitle className="text-xl">Match Details</DialogTitle>
          <DialogDescription>
            {isOrganizer
              ? "Record match scores, update status, and advance the winner."
              : "View current matchup and live results."}
          </DialogDescription>
        </DialogHeader>

        {isOrganizer ? (
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4 rounded-xl border border-border/70 bg-card/50 p-4">
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 font-medium text-sm">
                  {team1?.seed ? (
                    <span className="text-xs text-muted-foreground font-mono">
                      #{team1.seed}
                    </span>
                  ) : null}
                  <span className="truncate">{team1?.name ?? "TBD"}</span>
                </div>
                <Label htmlFor="t1-score" className="text-xs text-muted-foreground">
                  Score
                </Label>
                <Input
                  id="t1-score"
                  type="number"
                  min="0"
                  max="99"
                  disabled={!team1}
                  value={team1Score}
                  onChange={(e) => setTeam1Score(Number(e.target.value))}
                  className="font-bold text-center text-lg"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-1.5 font-medium text-sm">
                  {team2?.seed ? (
                    <span className="text-xs text-muted-foreground font-mono">
                      #{team2.seed}
                    </span>
                  ) : null}
                  <span className="truncate">{team2?.name ?? "TBD"}</span>
                </div>
                <Label htmlFor="t2-score" className="text-xs text-muted-foreground">
                  Score
                </Label>
                <Input
                  id="t2-score"
                  type="number"
                  min="0"
                  max="99"
                  disabled={!team2}
                  value={team2Score}
                  onChange={(e) => setTeam2Score(Number(e.target.value))}
                  className="font-bold text-center text-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Match Status</Label>
                <Select
                  value={status}
                  onValueChange={(val) => setStatus(val as MatchStatus)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                    <SelectItem value="LIVE">Live</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Winner Designation</Label>
                <Select value={winnerId} onValueChange={setWinnerId}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Winner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto (from score)</SelectItem>
                    {team1 ? (
                      <SelectItem value={String(team1.id)}>
                        {team1.name} (Team 1)
                      </SelectItem>
                    ) : null}
                    {team2 ? (
                      <SelectItem value={String(team2.id)}>
                        {team2.name} (Team 2)
                      </SelectItem>
                    ) : null}
                    <SelectItem value="none">Undecided</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="vod" className="text-xs">
                Broadcast / Stream / VOD Link
              </Label>
              <Input
                id="vod"
                placeholder="https://youtube.com/watch?v=..."
                value={vodUrl}
                onChange={(e) => setVodUrl(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="gap-2">
                {loading ? <Icons.Spinner className="h-4 w-4 animate-spin" /> : null}
                Save & Advance Winner
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-4 py-3">
            <div className="flex items-center justify-between rounded-xl border border-border/80 bg-muted/30 p-4">
              <div className="flex flex-col gap-1">
                <span className="font-semibold text-base">
                  {team1?.name ?? "TBD"}
                </span>
                {team1?.tag ? (
                  <span className="text-xs text-muted-foreground font-mono">
                    [{team1.tag}]
                  </span>
                ) : null}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold font-mono">
                  {match.team1Score}
                </span>
                <span className="text-muted-foreground font-semibold">VS</span>
                <span className="text-2xl font-bold font-mono">
                  {match.team2Score}
                </span>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="font-semibold text-base">
                  {team2?.name ?? "TBD"}
                </span>
                {team2?.tag ? (
                  <span className="text-xs text-muted-foreground font-mono">
                    [{team2.tag}]
                  </span>
                ) : null}
              </div>
            </div>

            {match.vodUrl ? (
              <div className="flex items-center justify-between rounded-lg border border-border/60 p-3 text-sm">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Icons.Play className="h-4 w-4 text-primary" />
                  Stream Broadcast
                </span>
                <a
                  href={match.vodUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-primary hover:underline text-xs"
                >
                  Watch VOD
                </a>
              </div>
            ) : null}

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
