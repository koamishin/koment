import { notFound } from "next/navigation";

import { EventForm } from "~/components/event/event-form";
import { DashboardShell } from "~/components/shell";
import type { Locale } from "~/config/i18n-config";
import { getDictionary } from "~/lib/get-dictionary";
import { trpc } from "~/trpc/server";

interface EventEditPageProps {
  params: { lang: Locale; organizationId: string; eventId: string };
}

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Edit event",
};

export default async function EventEditPage({
  params: { lang, organizationId, eventId },
}: EventEditPageProps) {
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

  const [organization, event] = await Promise.all([
    trpc.organization.getById
      .query({ organizationId: orgId })
      .catch(() => null),
    trpc.event.getById
      .query({ organizationId: orgId, eventId: id })
      .catch(() => null),
  ]);

  if (!organization || !event) {
    return notFound();
  }

  return (
    <DashboardShell
      title={dict.event.save_event}
      description={dict.event.title_text}
    >
      <EventForm
        organizationId={orgId}
        dict={dict.event}
        params={{ lang }}
        canApproveRegistrations={
          organization.entitlements.canApproveRegistrations
        }
        event={{
          id: event.id,
          name: event.name,
          description: event.description,
          location: event.location,
          coverImage: event.coverImage,
          startsAt: event.startsAt,
          endsAt: event.endsAt,
          capacity: event.capacity,
          requireApproval: event.requireApproval,
          isPublic: event.isPublic,
          status: event.status,
        }}
      />
    </DashboardShell>
  );
}
