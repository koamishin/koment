import { notFound } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@saasfly/ui/card";
import * as Icons from "@saasfly/ui/icons";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@saasfly/ui/table";

import { MemberRow } from "~/components/event/member-row";
import { DashboardShell } from "~/components/shell";
import type { Locale } from "~/config/i18n-config";
import { getDictionary } from "~/lib/get-dictionary";
import { trpc } from "~/trpc/server";

interface OrganizationMembersPageProps {
  params: { lang: Locale; organizationId: string };
}

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Members",
};

export default async function OrganizationMembersPage({
  params: { lang, organizationId },
}: OrganizationMembersPageProps) {
  const id = Number(organizationId);
  if (!Number.isInteger(id) || id <= 0) {
    return notFound();
  }

  const dict = await getDictionary(lang);

  const [organization, members] = await Promise.all([
    trpc.organization.getById.query({ organizationId: id }).catch(() => null),
    trpc.organization.listMembers.query({ organizationId: id }).catch(() => []),
  ]);

  if (!organization) {
    return notFound();
  }

  return (
    <DashboardShell
      eyebrow={organization.name}
      title={dict.event.members}
      description={dict.event.invite_code}
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {dict.event.invite_code}
            </CardTitle>
            <CardDescription className="flex items-center gap-2">
              <code className="rounded bg-muted px-2 py-1 text-sm tracking-widest">
                {organization.joinCode}
              </code>
              <Icons.Key className="h-3.5 w-3.5 text-muted-foreground" />
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="overflow-hidden border-border/70">
          <CardHeader>
            <CardTitle className="text-base">
              {organization.name} · {dict.event.members}
            </CardTitle>
            <CardDescription className="flex items-center gap-2">
              <Icons.Key className="h-3.5 w-3.5" />
              <code className="rounded-md bg-muted px-2 py-1 font-mono text-sm tracking-widest">
                {organization.joinCode}
              </code>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{dict.event.attendee}</TableHead>
                  <TableHead>{dict.event.role}</TableHead>
                  <TableHead className="text-right">ACTION</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <MemberRow
                    key={member.id}
                    organizationId={id}
                    member={{
                      id: member.id,
                      name: member.name,
                      email: member.email,
                      role: member.role,
                    }}
                    viewerRole={organization.viewerRole}
                    dict={dict.event}
                  />
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
