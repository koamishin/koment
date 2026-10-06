import { notFound } from "next/navigation";
import { trpc } from "~/trpc/server";
import { getDictionary } from "~/lib/get-dictionary";
import type { Locale } from "~/config/i18n-config";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@saasfly/ui/tabs";
import * as Icons from "@saasfly/ui/icons";
import { TournamentManageHeader } from "~/components/tournament/tournament-manage-header";
import {
  TournamentBracket,
  type BracketMatch,
  type BracketTeam,
} from "~/components/tournament/tournament-bracket";
import {
  TournamentRosterTable,
  type RosterTeam,
} from "~/components/tournament/tournament-roster-table";
import { StatCard } from "~/components/shell";

interface TournamentManagePageProps {
  params: { lang: Locale; organizationId: string; tournamentId: string };
}

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Tournament Studio | Dashboard",
};

export default async function TournamentManagePage({
  params: { lang, organizationId, tournamentId },
}: TournamentManagePageProps) {
  const orgId = Number(organizationId);
  const tId = Number(tournamentId);

  if (!Number.isInteger(orgId) || !Number.isInteger(tId)) {
    return notFound();
  }

  const [, data] = await Promise.all([
    getDictionary(lang),
    trpc.tournament.getById
      .query({ organizationId: orgId, tournamentId: tId })
      .catch(() => null),
  ]);

  if (!data?.tournament) {
    return notFound();
  }

  const { tournament, teams, matches } = data;
  const completedMatches = matches.filter((m) => m.status === "COMPLETED").length;

  return (
    <div className="space-y-8">
      <TournamentManageHeader
        organizationId={orgId}
        tournament={tournament}
        teamsCount={teams.length}
        hasMatches={matches.length > 0}
        lang={lang}
      />

      {/* KPI Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Registered Teams"
          value={`${teams.length} / ${tournament.maxTeams}`}
          icon={<Icons.Users className="h-4 w-4" />}
          hint={`Max ${tournament.maxTeams} slots`}
          tone="accent"
        />
        <StatCard
          label="Total Matches"
          value={matches.length}
          icon={<Icons.Swords className="h-4 w-4" />}
          tone="default"
        />
        <StatCard
          label="Matches Completed"
          value={completedMatches}
          icon={<Icons.Check className="h-4 w-4" />}
          hint={matches.length > 0 ? `${Math.round((completedMatches / matches.length) * 100)}% finished` : "Pending generation"}
          tone="success"
        />
        <StatCard
          label="Prize Pool"
          value={tournament.prizePool ?? "Bragging Rights"}
          icon={<Icons.Trophy className="h-4 w-4" />}
          tone="warning"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="bracket" className="space-y-6">
        <TabsList className="bg-card/70 border border-border/70 p-1">
          <TabsTrigger value="bracket" className="gap-2 text-xs font-semibold">
            <Icons.Swords className="h-3.5 w-3.5" />
            Live Bracket Studio
          </TabsTrigger>
          <TabsTrigger value="teams" className="gap-2 text-xs font-semibold">
            <Icons.Users className="h-3.5 w-3.5" />
            Roster & Seeding ({teams.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="bracket" className="space-y-4">
          <div className="rounded-xl border border-border/70 bg-card/40 p-4">
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Icons.ShieldCheck className="h-4 w-4 text-emerald-500" />
              Organizer Mode Active: click any match card to update scores, set status, or advance winners.
            </p>
          </div>

          <TournamentBracket
            matches={matches as BracketMatch[]}
            teams={teams as BracketTeam[]}
            organizationId={orgId}
            isOrganizer={true}
          />
        </TabsContent>

        <TabsContent value="teams" className="space-y-4">
          <TournamentRosterTable
            teams={teams as RosterTeam[]}
            organizationId={orgId}
            tournamentId={tournament.id}
            tournamentName={tournament.name}
            gameFormat={tournament.gameFormat}
            isOrganizer={true}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
