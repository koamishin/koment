import { notFound } from "next/navigation";
import { trpc } from "~/trpc/server";
import { getDictionary } from "~/lib/get-dictionary";
import type { Locale } from "~/config/i18n-config";
import { DashboardShell } from "~/components/shell";
import { TournamentCard } from "~/components/tournament/tournament-card";
import { TournamentCreateButton } from "~/components/tournament/tournament-create-button";
import { EmptyPlaceholder } from "~/components/empty-placeholder";

interface OrgTournamentsPageProps {
  params: { lang: Locale; organizationId: string };
}

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Tournaments | Dashboard",
};

export default async function OrgTournamentsPage({
  params: { lang, organizationId },
}: OrgTournamentsPageProps) {
  const id = Number(organizationId);
  if (!Number.isInteger(id) || id <= 0) {
    return notFound();
  }

  const [dict, organization, tournaments] = await Promise.all([
    getDictionary(lang),
    trpc.organization.getById.query({ organizationId: id }).catch(() => null),
    trpc.tournament.listByOrganization
      .query({ organizationId: id })
      .catch(() => []),
  ]);

  if (!organization) {
    return notFound();
  }

  return (
    <div className="space-y-8">
      <DashboardShell
        eyebrow={organization.name}
        title="Esports Tournaments"
        description="Create single and double elimination brackets, seed teams, and record live scores."
        headerAction={<TournamentCreateButton organizationId={id} />}
      />

      {tournaments.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tournaments.map((t) => (
            <TournamentCard
              key={t.id}
              tournament={t}
              lang={lang}
              manageHref={`/${lang}/dashboard/organizations/${id}/tournaments/${t.id}`}
            />
          ))}
        </div>
      ) : (
        <EmptyPlaceholder>
          <EmptyPlaceholder.Icon name="Gamepad" />
          <EmptyPlaceholder.Title>
            {dict.tournament?.no_tournaments_title ?? "No Tournaments Yet"}
          </EmptyPlaceholder.Title>
          <EmptyPlaceholder.Description>
            {dict.tournament?.no_tournaments_text ??
              "Create your first tournament, seed teams, and generate live brackets."}
          </EmptyPlaceholder.Description>
          <TournamentCreateButton organizationId={id} variant="outline" />
        </EmptyPlaceholder>
      )}
    </div>
  );
}
