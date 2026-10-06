"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
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
import { Textarea } from "@saasfly/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@saasfly/ui/select";
import { Switch } from "@saasfly/ui/switch";
import { toast } from "@saasfly/ui/use-toast";
import * as Icons from "@saasfly/ui/icons";
import { trpc } from "~/trpc/client";
import type { TournamentStatus, TournamentType } from "./tournament-badges";

const POPULAR_GAMES = [
  "Valorant",
  "Counter-Strike 2",
  "League of Legends",
  "Rocket League",
  "Dota 2",
  "Super Smash Bros. Ultimate",
  "Apex Legends",
  "Overwatch 2",
  "EA Sports FC 25",
  "Rainbow Six Siege",
  "Fortnite",
  "Custom / Other",
];

export interface TournamentEditData {
  id?: number;
  eventId?: number | null;
  name: string;
  description?: string | null;
  game: string;
  gameFormat: string;
  tournamentType: TournamentType;
  status: TournamentStatus;
  prizePool?: string | null;
  rules?: string | null;
  maxTeams: number;
  matchType: string;
  coverImage?: string | null;
  streamUrl?: string | null;
  startsAt: Date | string;
  endsAt?: Date | string | null;
  isPublic: boolean;
}

interface TournamentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId?: number;
  organizations?: { id: number; name: string }[];
  tournament?: TournamentEditData | null;
  onSaved?: (tournamentId: number) => void;
  lang?: string;
}

export function TournamentFormDialog({
  open,
  onOpenChange,
  organizationId,
  organizations,
  tournament,
  onSaved,
  lang,
}: TournamentFormDialogProps) {
  const router = useRouter();
  const params = useParams();
  const [selectedOrgId, setSelectedOrgId] = React.useState<number>(
    organizationId ?? organizations?.[0]?.id ?? 0,
  );
  const [eventId, setEventId] = React.useState<number | undefined>(undefined);
  const [name, setName] = React.useState("");
  const [game, setGame] = React.useState("Valorant");
  const [customGame, setCustomGame] = React.useState("");
  const [gameFormat, setGameFormat] = React.useState("5v5");
  const [tournamentType, setTournamentType] = React.useState<TournamentType>(
    "SINGLE_ELIMINATION",
  );
  const [status, setStatus] = React.useState<TournamentStatus>(
    "REGISTRATION",
  );
  const [maxTeams, setMaxTeams] = React.useState(16);
  const [matchType, setMatchType] = React.useState("BO3");
  const [prizePool, setPrizePool] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [rules, setRules] = React.useState("");
  const [streamUrl, setStreamUrl] = React.useState("");
  const [startsAt, setStartsAt] = React.useState(
    new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 16),
  );
  const [isPublic, setIsPublic] = React.useState(true);
  const [loading, setLoading] = React.useState(false);

  const [orgEvents, setOrgEvents] = React.useState<
    { id: number; name: string; startsAt: Date | string }[]
  >([]);

  React.useEffect(() => {
    if (selectedOrgId > 0) {
      void trpc.event.listByOrganization
        .query({ organizationId: selectedOrgId })
        .then((items) => setOrgEvents(items))
        .catch(() => setOrgEvents([]));
    } else {
      setOrgEvents([]);
    }
  }, [selectedOrgId]);

  React.useEffect(() => {
    if (tournament) {
      setName(tournament.name);
      setEventId(tournament.eventId ?? undefined);
      if (POPULAR_GAMES.includes(tournament.game)) {
        setGame(tournament.game);
        setCustomGame("");
      } else {
        setGame("Custom / Other");
        setCustomGame(tournament.game);
      }
      setGameFormat(tournament.gameFormat ?? "5v5");
      setTournamentType(tournament.tournamentType ?? "SINGLE_ELIMINATION");
      setStatus(tournament.status ?? "REGISTRATION");
      setMaxTeams(tournament.maxTeams ?? 16);
      setMatchType(tournament.matchType ?? "BO3");
      setPrizePool(tournament.prizePool ?? "");
      setDescription(tournament.description ?? "");
      setRules(tournament.rules ?? "");
      setStreamUrl(tournament.streamUrl ?? "");
      setStartsAt(
        new Date(tournament.startsAt || Date.now()).toISOString().slice(0, 16),
      );
      setIsPublic(tournament.isPublic ?? true);
    } else {
      setName("");
      setEventId(undefined);
      setGame("Valorant");
      setCustomGame("");
      setGameFormat("5v5");
      setTournamentType("SINGLE_ELIMINATION");
      setStatus("REGISTRATION");
      setMaxTeams(16);
      setMatchType("BO3");
      setPrizePool("$1,000");
      setDescription("");
      setRules("");
      setStreamUrl("");
      setStartsAt(
        new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 16),
      );
      setIsPublic(true);
    }
  }, [tournament, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({
        title: "Name required",
        description: "Please specify a tournament name.",
        variant: "destructive",
      });
      return;
    }

    const resolvedGame =
      game === "Custom / Other" ? (customGame.trim() || "Esports") : game;

    const targetOrgId =
      organizationId ?? (selectedOrgId > 0 ? selectedOrgId : undefined) ?? organizations?.[0]?.id;
    if (!targetOrgId) {
      toast({
        title: "Workspace required",
        description: "Please select or create an organization workspace first.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const res: { id: number; name: string } =
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        await trpc.tournament.upsert.mutate({
        id: tournament?.id,
        organizationId: targetOrgId,
        eventId: eventId ?? undefined,
        name: name.trim(),
        description: description.trim() || undefined,
        game: resolvedGame,
        gameFormat,
        tournamentType,
        status,
        maxTeams: Number(maxTeams),
        matchType,
        prizePool: prizePool.trim() || undefined,
        rules: rules.trim() || undefined,
        streamUrl: streamUrl.trim() || undefined,
        startsAt: new Date(startsAt),
        isPublic,
      });

      toast({
        title: tournament?.id ? "Tournament Updated" : "Tournament Created",
        description: `${res.name} is ready for bracket management.`,
      });

      onOpenChange(false);
      if (onSaved) {
        onSaved(res.id);
      } else if (!tournament?.id) {
        const currentLang = (params?.lang as string) ?? lang ?? "en";
        router.push(
          `/${currentLang}/dashboard/organizations/${targetOrgId}/tournaments/${res.id}`,
        );
      }
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save tournament.";
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
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {tournament?.id ? "Edit Esports Tournament" : "New Esports Tournament"}
          </DialogTitle>
          <DialogDescription>
            Configure tournament settings, format, seeding parameters and rules.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {organizations && organizations.length > 1 && !tournament?.id ? (
            <div className="space-y-1.5">
              <Label>Organizer Workspace *</Label>
              <Select
                value={String(selectedOrgId || organizations[0]?.id)}
                onValueChange={(v) => setSelectedOrgId(Number(v))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pick Workspace" />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={String(org.id)}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="t-name">Tournament Title *</Label>
            <Input
              id="t-name"
              placeholder="Valorant Masters Cup: Season 1"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {orgEvents.length > 0 ? (
            <div className="space-y-1.5">
              <Label className="text-xs">Associate with Event (Optional)</Label>
              <Select
                value={eventId ? String(eventId) : "none"}
                onValueChange={(v) =>
                  setEventId(v === "none" ? undefined : Number(v))
                }
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Standalone Tournament (No Event)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    Standalone Tournament (No Event)
                  </SelectItem>
                  {orgEvents.map((ev) => (
                    <SelectItem key={ev.id} value={String(ev.id)}>
                      {ev.name} ({new Date(ev.startsAt).toLocaleDateString()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                Linking connects tournament team registrations to event check-in passes.
              </p>
            </div>
          ) : null}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Game Title *</Label>
              <Select value={game} onValueChange={setGame}>
                <SelectTrigger>
                  <SelectValue placeholder="Pick Game" />
                </SelectTrigger>
                <SelectContent>
                  {POPULAR_GAMES.map((g) => (
                    <SelectItem key={g} value={g}>
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {game === "Custom / Other" ? (
              <div className="space-y-1.5">
                <Label htmlFor="custom-game">Custom Game Name</Label>
                <Input
                  id="custom-game"
                  placeholder="e.g. Street Fighter 6"
                  value={customGame}
                  onChange={(e) => setCustomGame(e.target.value)}
                  required
                />
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label>Game Format</Label>
                <Select value={gameFormat} onValueChange={setGameFormat}>
                  <SelectTrigger>
                    <SelectValue placeholder="Format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5v5">5v5 Team</SelectItem>
                    <SelectItem value="1v1">1v1 Solo</SelectItem>
                    <SelectItem value="2v2">2v2 Duo</SelectItem>
                    <SelectItem value="3v3">3v3 Trio</SelectItem>
                    <SelectItem value="4v4">4v4 Squad</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Bracket System</Label>
              <Select
                value={tournamentType}
                onValueChange={(v) => setTournamentType(v as TournamentType)}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SINGLE_ELIMINATION">
                    Single Elimination
                  </SelectItem>
                  <SelectItem value="DOUBLE_ELIMINATION">
                    Double Elimination
                  </SelectItem>
                  <SelectItem value="ROUND_ROBIN">
                    Round Robin
                  </SelectItem>
                  <SelectItem value="SWISS">Swiss System</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Max Teams / Slots</Label>
              <Select
                value={String(maxTeams)}
                onValueChange={(v) => setMaxTeams(Number(v))}
              >
                <SelectTrigger className="h-9 text-xs font-mono">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="4">4 Teams</SelectItem>
                  <SelectItem value="8">8 Teams</SelectItem>
                  <SelectItem value="16">16 Teams</SelectItem>
                  <SelectItem value="32">32 Teams</SelectItem>
                  <SelectItem value="64">64 Teams</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Match Series</Label>
              <Select value={matchType} onValueChange={setMatchType}>
                <SelectTrigger className="h-9 text-xs font-mono">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BO1">Best of 1</SelectItem>
                  <SelectItem value="BO3">Best of 3</SelectItem>
                  <SelectItem value="BO5">Best of 5</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="prize" className="text-xs">
                Prize Pool
              </Label>
              <Input
                id="prize"
                placeholder="$5,000"
                value={prizePool}
                onChange={(e) => setPrizePool(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="starts" className="text-xs">
                Tournament Start Time *
              </Label>
              <Input
                id="starts"
                type="datetime-local"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="h-9 text-xs"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="stream" className="text-xs">
                Broadcast / Stream Link (Twitch / YouTube)
              </Label>
              <Input
                id="stream"
                placeholder="https://twitch.tv/..."
                value={streamUrl}
                onChange={(e) => setStreamUrl(e.target.value)}
                className="h-9 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rules" className="text-xs">
              Rules, Format Details & Anti-Cheat
            </Label>
            <Textarea
              id="rules"
              rows={3}
              placeholder="Specify lobby settings, map veto process, match check-in window, and dispute procedure..."
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              className="text-xs"
            />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border/70 p-3 bg-muted/20">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Public Discovery</Label>
              <p className="text-xs text-muted-foreground">
                Display this tournament on the public esports directory.
              </p>
            </div>
            <Switch checked={isPublic} onCheckedChange={setIsPublic} />
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
              {tournament?.id ? "Save Tournament" : "Create Tournament"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
