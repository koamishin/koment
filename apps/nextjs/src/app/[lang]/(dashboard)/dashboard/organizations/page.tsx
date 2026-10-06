import { redirect } from "next/navigation";
import Link from "next/link";

import { authOptions, getCurrentUser } from "@saasfly/auth";
import { Card, CardContent } from "@saasfly/ui/card";
import * as Icons from "@saasfly/ui/icons";

import { EmptyPlaceholder } from "~/components/empty-placeholder";
import type { EventDict } from "~/components/event/dict";
import { PlanBadge } from "~/components/event/event-badges";
import { OrganizationDialog } from "~/components/event/organization-dialog";
import { DashboardShell } from "~/components/shell";
import type { Locale } from "~/config/i18n-config";
import { getDictionary } from "~/lib/get-dictionary";
import { trpc } from "~/trpc/server";

interface OrganizationListPageProps {
  params: { lang: Locale };
}

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Organizations",
};

function roleLabel(dict: EventDict, role: string): string {
  const labels: Record<string, string> = {
    OWNER: dict.role_owner,
    ADMIN: dict.role_admin,
    STAFF: dict.role_staff,
    MEMBER: dict.role_member,
  };
  return labels[role] ?? role;
}

export default async function OrganizationListPage({
  params: { lang },
}: OrganizationListPageProps) {
  const user = await getCurrentUser();
  if (!user) {
    redirect(authOptions?.pages?.signIn ?? "/login-clerk");
  }

  const [dict, organizations] = await Promise.all([
    getDictionary(lang),
    trpc.organization.listMine.query(),
  ]);
  const eventDict = dict.event;

  return (
    <DashboardShell
      eyebrow={dict.event.orgs}
      title={dict.event.orgs_title}
      description={dict.event.orgs_text}
      headerAction={<OrganizationDialog dict={eventDict} params={{ lang }} />}
    >
      {organizations.length ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {organizations.map((organization, index) => (
            <Link
              key={organization.id}
              href={`/${lang}/dashboard/organizations/${organization.id}`}
              className="group relative overflow-hidden rounded-2xl border border-border/70 bg-card/60 p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-primary/15 blur-3xl transition-opacity group-hover:bg-primary/25"
              />
              <div className="relative space-y-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 font-heading text-lg font-bold text-primary-foreground shadow-sm">
                    {organization.name.slice(0, 1).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-heading text-lg font-semibold leading-tight">
                      {organization.name}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {roleLabel(eventDict, organization.role)}
                    </p>
                  </div>
                  <Icons.ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <PlanBadge plan={organization.plan} />
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/50 px-2.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                    <Icons.Key className="h-3 w-3" />
                    {organization.joinCode}
                  </span>
                </div>
              </div>
              <span className="sr-only">{index + 1}</span>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyPlaceholder className="min-h-[420px] border-dashed bg-card/30">
          <EmptyPlaceholder.Icon name="Organization" />
          <EmptyPlaceholder.Title>
            {dict.event.no_orgs_yet}
          </EmptyPlaceholder.Title>
          <EmptyPlaceholder.Description>
            {dict.event.create_first_org}
          </EmptyPlaceholder.Description>
          <OrganizationDialog dict={eventDict} params={{ lang }} />
        </EmptyPlaceholder>
      )}

      {organizations.length ? (
        <Card className="border-dashed bg-card/20">
          <CardContent className="flex flex-col items-start gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">{dict.event.join_org}</p>
              <p className="text-sm text-muted-foreground">
                {dict.event.invite_code}
              </p>
            </div>
            <OrganizationDialog dict={eventDict} params={{ lang }} />
          </CardContent>
        </Card>
      ) : null}
    </DashboardShell>
  );
}
