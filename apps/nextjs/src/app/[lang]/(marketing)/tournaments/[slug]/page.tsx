import { notFound } from "next/navigation";
import { trpc } from "~/trpc/server";
import type { Locale } from "~/config/i18n-config";
import { TournamentPublicView } from "~/components/tournament/tournament-public-view";

interface TournamentSlugPageProps {
  params: { lang: Locale; slug: string };
  searchParams?: { register?: string; action?: string };
}

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params: { slug },
}: TournamentSlugPageProps) {
  const data = await trpc.tournament.getBySlug
    .query({ slug })
    .catch(() => null);

  if (!data?.tournament) {
    return { title: "Tournament Not Found" };
  }

  return {
    title: `${data.tournament.name} | KoaTournament`,
    description:
      data.tournament.description ??
      `Live interactive bracket and match details for ${data.tournament.name} (${data.tournament.game}).`,
  };
}

export default async function TournamentSlugPage({
  params: { lang, slug },
  searchParams,
}: TournamentSlugPageProps) {
  const data = await trpc.tournament.getBySlug
    .query({ slug })
    .catch(() => null);

  if (!data?.tournament) {
    return notFound();
  }

  const shouldAutoRegister =
    searchParams?.register === "true" || searchParams?.action === "register";

  return (
    <div className="container py-8 md:py-12">
      <TournamentPublicView
        tournament={data.tournament}
        teams={data.teams}
        matches={data.matches}
        lang={lang}
        initialRegisterOpen={shouldAutoRegister}
      />
    </div>
  );
}
