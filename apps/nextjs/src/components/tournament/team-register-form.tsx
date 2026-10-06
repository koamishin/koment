"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, buttonVariants } from "@saasfly/ui/button";
import { Input } from "@saasfly/ui/input";
import { Label } from "@saasfly/ui/label";
import { Badge } from "@saasfly/ui/badge";
import { toast } from "@saasfly/ui/use-toast";
import * as Icons from "@saasfly/ui/icons";
import { cn } from "@saasfly/ui";
import { trpc } from "~/trpc/client";

interface TeamRegisterFormProps {
  tournamentId: number;
  tournamentName: string;
  tournamentSlug: string;
  gameFormat?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  standalone?: boolean;
  lang?: string;
}

export function TeamRegisterForm({
  tournamentId,
  tournamentName,
  tournamentSlug,
  gameFormat = "5v5",
  onSuccess,
  onCancel,
  standalone = false,
  lang = "en",
}: TeamRegisterFormProps) {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [tag, setTag] = React.useState("");
  const [captainName, setCaptainName] = React.useState("");
  const [captainEmail, setCaptainEmail] = React.useState("");
  const [captainContact, setCaptainContact] = React.useState("");
  const [teammates, setTeammates] = React.useState<string[]>(["", ""]);
  const [loading, setLoading] = React.useState(false);
  const [registeredTeam, setRegisteredTeam] = React.useState<{
    name: string;
    tag?: string | null;
    checkInCode: string;
  } | null>(null);

  const addTeammate = () => {
    if (teammates.length >= 8) return;
    setTeammates([...teammates, ""]);
  };

  const removeTeammate = (index: number) => {
    if (teammates.length <= 1) return;
    setTeammates(teammates.filter((_, i) => i !== index));
  };

  const updateTeammate = (index: number, value: string) => {
    const updated = [...teammates];
    updated[index] = value;
    setTeammates(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({
        title: "Team Name Missing",
        description: "Please enter your squad or gamer name.",
        variant: "destructive",
      });
      return;
    }
    if (!captainName.trim()) {
      toast({
        title: "Captain Name Missing",
        description: "Enter your name or student gamertag as team lead.",
        variant: "destructive",
      });
      return;
    }
    if (!captainEmail.trim() || !captainEmail.includes("@")) {
      toast({
        title: "Valid Email Required",
        description: "We send tournament alerts and your digital pass here.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const validPlayers = teammates
        .map((t) => t.trim())
        .filter((t) => t.length > 0)
        .map((playerName) => ({ name: playerName, role: "Player" }));

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const team = (await trpc.tournament.registerTeam.mutate({
        tournamentId,
        name: name.trim(),
        tag: tag.trim().toUpperCase() || undefined,
        captainName: captainName.trim(),
        captainEmail: captainEmail.trim(),
        captainDiscord: captainContact.trim() || undefined,
        players: validPlayers.length > 0 ? validPlayers : undefined,
      })) as { name: string; tag?: string | null; checkInCode: string };

      toast({
        title: "🎉 You're In! Team Registered",
        description: `${name} has been enrolled in ${tournamentName}. Check your pass code below!`,
      });

      setRegisteredTeam({
        name: team.name,
        tag: team.tag,
        checkInCode: team.checkInCode,
      });

      onSuccess?.();
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to register team.";
      toast({
        title: "Registration Failed",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // If already registered and in standalone mode, display success receipt!
  if (registeredTeam && standalone) {
    return (
      <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-b from-card via-card/80 to-background p-8 text-center space-y-6 shadow-2xl backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-500">
          <Icons.Check className="h-8 w-8 stroke-[3]" />
        </div>

        <div className="space-y-2">
          <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 font-mono text-xs">
            Registration Confirmed
          </Badge>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-foreground">
            {registeredTeam.name} is Enrolled!
          </h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Your team has been confirmed for <strong className="text-foreground">{tournamentName}</strong>. Save your digital pass code below.
          </p>
        </div>

        <div className="mx-auto max-w-sm rounded-2xl border border-border/80 bg-muted/30 p-4 space-y-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            Team Check-in Pass Code
          </span>
          <p className="font-mono text-2xl font-black tracking-widest text-primary">
            {registeredTeam.checkInCode}
          </p>
          <p className="text-[11px] text-muted-foreground">
            Present this code at match check-in or show your digital QR pass.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href={`/${lang}/tournaments/${tournamentSlug}`}
            className={cn(buttonVariants({ variant: "default" }), "w-full sm:w-auto gap-2 font-bold shadow-md")}
          >
            <Icons.Swords className="h-4 w-4" />
            View Live Bracket
          </Link>
          <Link
            href={`/${lang}/dashboard/registrations`}
            className={cn(buttonVariants({ variant: "outline" }), "w-full sm:w-auto gap-2")}
          >
            <Icons.Ticket className="h-4 w-4" />
            My Passes & Roster
          </Link>
          <Button
            variant="ghost"
            onClick={() => {
              setRegisteredTeam(null);
              setName("");
              setTag("");
              setCaptainName("");
              setCaptainEmail("");
              setCaptainContact("");
              setTeammates(["", ""]);
            }}
            className="w-full sm:w-auto text-xs text-muted-foreground"
          >
            Register Another Team
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Step 1: Team Identity */}
      <div className="rounded-2xl border border-border/80 bg-card/60 p-5 space-y-4 shadow-sm">
        <div className="flex items-center gap-2 border-b border-border/60 pb-3">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground font-mono font-black text-xs">
            1
          </span>
          <div>
            <h4 className="font-bold text-sm tracking-tight text-foreground">
              Team Name
            </h4>
            <p className="text-[11px] text-muted-foreground">
              Your squad, club, or solo gamer handle
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2 space-y-1.5">
            <Label htmlFor="reg-name" className="text-xs font-semibold">
              Team / Gamer Name *
            </Label>
            <Input
              id="reg-name"
              placeholder="e.g. Sentinels Varsity or Team Phoenix"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10 text-xs"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reg-tag" className="text-xs font-semibold">
              Short Tag (Optional)
            </Label>
            <Input
              id="reg-tag"
              placeholder="e.g. SEN"
              maxLength={5}
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              className="h-10 text-xs uppercase font-mono"
            />
          </div>
        </div>
      </div>

      {/* Step 2: Captain Contact */}
      <div className="rounded-2xl border border-border/80 bg-card/60 p-5 space-y-4 shadow-sm">
        <div className="flex items-center gap-2 border-b border-border/60 pb-3">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground font-mono font-black text-xs">
            2
          </span>
          <div>
            <h4 className="font-bold text-sm tracking-tight text-foreground">
              Captain & Point of Contact
            </h4>
            <p className="text-[11px] text-muted-foreground">
              We send match room invites and door check-in pass here
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="reg-cap-name" className="text-xs font-semibold">
              Captain Name or Gamertag *
            </Label>
            <Input
              id="reg-cap-name"
              placeholder="e.g. Alex Rivera or TenZ#NA1"
              value={captainName}
              onChange={(e) => setCaptainName(e.target.value)}
              className="h-10 text-xs"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reg-cap-email" className="text-xs font-semibold">
              Student / Contact Email *
            </Label>
            <Input
              id="reg-cap-email"
              type="email"
              placeholder="student@school.edu"
              value={captainEmail}
              onChange={(e) => setCaptainEmail(e.target.value)}
              className="h-10 text-xs"
              required
            />
          </div>

          <div className="sm:col-span-2 space-y-1.5">
            <Label htmlFor="reg-cap-contact" className="text-xs font-semibold">
              Phone Number, WhatsApp, or Discord (Optional)
            </Label>
            <Input
              id="reg-cap-contact"
              placeholder="e.g. +1 555-0192, WhatsApp, or @username (optional)"
              value={captainContact}
              onChange={(e) => setCaptainContact(e.target.value)}
              className="h-10 text-xs"
            />
            <p className="text-[11px] text-muted-foreground">
              Optional alternative contact for organizer match pings if email is slow.
            </p>
          </div>
        </div>
      </div>

      {/* Step 3: Teammates (No roles, just names) */}
      <div className="rounded-2xl border border-border/80 bg-card/60 p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground font-mono font-black text-xs">
              3
            </span>
            <div>
              <h4 className="font-bold text-sm tracking-tight text-foreground">
                Teammate Roster (Optional)
              </h4>
              <p className="text-[11px] text-muted-foreground">
                Enter your teammates&apos; names or gamertags. You can also add or change them later.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono text-muted-foreground">
            Format: {gameFormat}
          </span>
        </div>

        <div className="space-y-2.5">
          {teammates.map((teammateName, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-muted-foreground w-7 text-center">
                P{idx + 2}
              </span>
              <Input
                placeholder={`Teammate #${idx + 2} Student Name or Gamertag`}
                value={teammateName}
                onChange={(e) => updateTeammate(idx, e.target.value)}
                className="h-9 text-xs flex-1"
              />
              {teammates.length > 1 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeTeammate(idx)}
                  className="h-9 w-9 p-0 text-muted-foreground hover:text-destructive shrink-0"
                  title="Remove teammate slot"
                >
                  <Icons.Close className="h-4 w-4" />
                </Button>
              ) : null}
            </div>
          ))}

          {teammates.length < 8 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addTeammate}
              className="w-full gap-1.5 text-xs h-9 border-dashed mt-1"
            >
              <Icons.Add className="h-3.5 w-3.5" />
              Add Another Teammate
            </Button>
          ) : null}
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        {onCancel ? (
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={loading}
            className="text-xs"
          >
            Cancel
          </Button>
        ) : (
          <Link
            href={`/${lang}/tournaments/${tournamentSlug}`}
            className="text-xs text-muted-foreground hover:underline flex items-center gap-1"
          >
            ← View Live Bracket & Info
          </Link>
        )}

        <Button
          type="submit"
          disabled={loading}
          size={standalone ? "lg" : "default"}
          className="gap-2 font-bold px-8 shadow-lg shadow-primary/25 bg-primary hover:bg-primary/90"
        >
          {loading ? (
            <Icons.Spinner className="h-4 w-4 animate-spin" />
          ) : (
            <Icons.Ticket className="h-4 w-4" />
          )}
          Complete Team Registration
        </Button>
      </div>
    </form>
  );
}
