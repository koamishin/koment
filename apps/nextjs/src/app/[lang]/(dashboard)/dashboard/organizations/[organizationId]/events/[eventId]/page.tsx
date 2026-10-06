import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@saasfly/ui/badge";
import { Button, buttonVariants } from "@saasfly/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@saasfly/ui/card";
import * as Icons from "@saasfly/ui/icons";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@saasfly/ui/tabs";
import { cn } from "@saasfly/ui";

import {
  DateTimeLabel,
  EventStatusBadge,
} from "~/components/event/event-badges";
import { CheckInScanner, LiveStats } from "~/components/event/check-in-scanner";
import { EventStatusToggle } from "~/components/event/event-status-toggle";
import { FieldEditor } from "~/components/event/field-editor";
import { RosterTable } from "~/components/event/roster-table";
import { DashboardShell } from "~/components/shell";
import { OrgRole } from "@saasfly/db/enums";
import type { Locale } from "~/config/i18n-config";
import { getDictionary } from "~/lib/get-dictionary";
import { trpc } from "~/trpc/server";

interface EventDetailPageProps {
  params: { lang: Locale; organizationId: string; eventId: string };
}

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Event",
};

export default async function EventDetailPage({
  params: { lang, organizationId, eventId },
}: EventDetailPageProps) {
  const orgId = Number(organizationId);
  const id = Number(eventId);

  if (
    !Number.isInteger(orgId) ||
    orgId <= 0 ||
    !Number.isInteger(id) ||
    id <= 0
  ) {
    return notFound();
  }

  const dict = await getDictionary(lang);

  const [organization, event, fields] = await Promise.all([
    trpc.organization.getById
      .query({ organizationId: orgId })
      .catch(() => null),
    trpc.event.getById
      .query({ organizationId: orgId, eventId: id })
      .catch(() => null),
    trpc.event.listFields.query({ eventId: id }).catch(() => []),
  ]);

  if (!organization || !event) {
    return notFound();
  }

  const canAdmin =
    event.viewerRole === OrgRole.OWNER || event.viewerRole === OrgRole.ADMIN;

  const eventUrl = `/${lang}/events/${event.slug}`;

  return (
    <DashboardShell
      eyebrow={organization.name}
      title={event.name}
      description={event.location ?? dict.event.title_text}
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <EventStatusBadge status={event.status} dict={dict.event} />
          {event.requireApproval ? (
            <Badge variant="warning">{dict.event.require_approval}</Badge>
          ) : null}
          {!event.isPublic ? (
            <Badge variant="secondary">{dict.event.status_draft}</Badge>
          ) : null}
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <Icons.Clock className="h-3.5 w-3.5" />
            <DateTimeLabel value={event.startsAt} locale={lang} />
          </span>
          {event.location ? (
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Icons.MapPin className="h-3.5 w-3.5" />
              {event.location}
            </span>
          ) : null}
          <span className="text-sm text-muted-foreground">
            {dict.event.organizer}: {organization.name}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {canAdmin ? (
            <>
              <Button variant="outline" size="sm" asChild>
                <Link
                  href={`/${lang}/dashboard/organizations/${orgId}/events/${id}/edit`}
                >
                  {dict.event.save_event}
                </Link>
              </Button>
              <EventStatusToggle
                organizationId={orgId}
                event={{
                  id: event.id,
                  name: event.name,
                  startsAt: event.startsAt,
                  status: event.status,
                }}
                dict={dict.event}
              />
            </>
          ) : null}
          <Link
            href={eventUrl}
            target="_blank"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            <Icons.ArrowRight className="mr-2 h-4 w-4" />
            {dict.event.browse_events}
          </Link>
          {organization.entitlements.canCsvExport ? (
            <a
              href={`/api/events/${orgId}/${id}/export`}
              className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
            >
              <Icons.Download className="mr-2 h-4 w-4" />
              {dict.event.export_csv}
            </a>
          ) : null}
        </div>

        {event.description ? (
          <Card>
            <CardContent className="pt-6 text-sm text-muted-foreground">
              {event.description}
            </CardContent>
          </Card>
        ) : null}

        <LiveStats
          confirmed={event.stats.confirmed}
          pending={event.stats.pending}
          present={event.stats.checkedIn}
          capacity={event.capacity}
          dict={dict.event}
        />

        <Tabs defaultValue="roster">
          <TabsList>
            <TabsTrigger value="roster">
              {dict.event.roster} ({event.stats.confirmed + event.stats.pending}
              )
            </TabsTrigger>
            <TabsTrigger value="checkin">{dict.event.check_in}</TabsTrigger>
            <TabsTrigger value="fields">{dict.event.custom_fields}</TabsTrigger>
          </TabsList>

          <TabsContent value="roster" className="mt-4">
            <RosterTable
              organizationId={orgId}
              eventId={id}
              canApprove={organization.entitlements.canApproveRegistrations}
              dict={dict.event}
              locale={lang}
            />
          </TabsContent>

          <TabsContent value="checkin" className="mt-4">
            <CheckInScanner
              organizationId={orgId}
              eventId={id}
              canQr={organization.entitlements.canQrCheckIn}
              dict={dict.event}
            />
          </TabsContent>

          <TabsContent value="fields" className="mt-4">
            <div className="space-y-4">
              {!organization.entitlements.canCustomFields ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      {dict.event.custom_fields}
                    </CardTitle>
                    <CardDescription>{dict.event.upgrade_hint}</CardDescription>
                  </CardHeader>
                </Card>
              ) : null}
              <FieldEditor
                eventId={id}
                fields={fields.map((field) => ({
                  id: field.id,
                  key: field.key,
                  label: field.label,
                  type: field.type,
                  options: field.options,
                  required: field.required,
                  position: field.position,
                }))}
                canCustomFields={organization.entitlements.canCustomFields}
                maxCustomFields={organization.entitlements.maxCustomFields}
                dict={dict.event}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  );
}
