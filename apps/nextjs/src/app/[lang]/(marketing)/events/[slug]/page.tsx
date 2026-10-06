import Link from "next/link";
import { notFound } from "next/navigation";

import { getCurrentUser } from "@saasfly/auth";
import { Badge } from "@saasfly/ui/badge";
import { buttonVariants } from "@saasfly/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@saasfly/ui/card";
import * as Icons from "@saasfly/ui/icons";
import { cn } from "@saasfly/ui";

import { CapacityMeter, DateTimeLabel } from "~/components/event/event-badges";
import { RegistrationForm } from "~/components/event/registration-form";
import type { Locale } from "~/config/i18n-config";
import { getDictionary } from "~/lib/get-dictionary";
import { trpc } from "~/trpc/server";

interface EventDetailPageProps {
  params: { lang: Locale; slug: string };
}

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Event",
};

export default async function EventDetailPage({
  params: { lang, slug },
}: EventDetailPageProps) {
  const dict = await getDictionary(lang);
  const user = await getCurrentUser();

  const event = await trpc.event.getBySlug.query({ slug }).catch(() => null);
  if (!event) {
    return notFound();
  }

  const mine = user
    ? await trpc.registration.listMine
        .query()
        .then((rows) => rows.find((row) => row.eventId === event.id))
        .catch(() => undefined)
    : undefined;

  const tournaments = await trpc.tournament.listByEvent
    .query({ eventId: event.id })
    .catch(() => []);

  const isFull =
    event.capacity !== null && event.confirmedCount >= event.capacity;

  return (
    <div className="container max-w-3xl py-10">
      <div className="mb-6">
        <Link
          href={`/${lang}/events`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← {dict.event.browse_events}
        </Link>
      </div>

      {event.coverImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={event.coverImage}
          alt={event.name}
          className="mb-6 max-h-72 w-full rounded-md object-cover"
        />
      ) : null}

      <h1 className="font-heading text-3xl md:text-4xl">{event.name}</h1>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <Icons.Organization className="h-3.5 w-3.5" />
          {event.organizationName}
        </span>
        <span className="flex items-center gap-1">
          <Icons.Clock className="h-3.5 w-3.5" />
          <DateTimeLabel value={event.startsAt} locale={lang} />
        </span>
        {event.location ? (
          <span className="flex items-center gap-1">
            <Icons.MapPin className="h-3.5 w-3.5" />
            {event.location}
          </span>
        ) : null}
        {event.requireApproval ? (
          <Badge variant="warning">{dict.event.require_approval}</Badge>
        ) : null}
      </div>

      {event.description ? (
        <p className="mt-6 whitespace-pre-line text-muted-foreground">
          {event.description}
        </p>
      ) : null}

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-base">{dict.event.registered}</CardTitle>
          <CardDescription>
            <CapacityMeter
              used={event.confirmedCount}
              capacity={event.capacity}
              dict={dict.event}
            />
          </CardDescription>
        </CardHeader>
      </Card>

      {tournaments.length > 0 ? (
        <Card className="mt-8 border-primary/30 bg-primary/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Icons.Swords className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Esports Tournaments at this Event</CardTitle>
            </div>
            <CardDescription>
              Competing in the tournament grants you access to this event.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {tournaments.map((t) => (
              <div
                key={t.id}
                className="flex flex-col justify-between rounded-xl border border-border/70 bg-card p-4 space-y-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase text-primary font-mono">
                      {t.game}
                    </span>
                    <Badge variant="outline" className="text-[10px]">
                      {t.gameFormat}
                    </Badge>
                  </div>
                  <h4 className="font-bold text-base">{t.name}</h4>
                  {t.prizePool ? (
                    <p className="text-xs text-amber-500 font-semibold">
                      Prize Pool: {t.prizePool}
                    </p>
                  ) : null}
                </div>
                <Link
                  href={`/${lang}/tournaments/${t.slug}`}
                  className={cn(buttonVariants({ size: "sm" }), "gap-1.5 text-xs font-semibold w-full")}
                >
                  <Icons.Swords className="h-3.5 w-3.5" />
                  View Bracket & Register Team
                </Link>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <div className="mt-8">
        {mine ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {mine.status === "PENDING"
                  ? dict.event.registered_pending
                  : dict.event.registered_ok}
              </CardTitle>
              <CardDescription>
                <Link
                  href={`/${lang}/dashboard/registrations`}
                  className="underline"
                >
                  {dict.event.view_pass}
                </Link>
              </CardDescription>
            </CardHeader>
          </Card>
        ) : !user ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{dict.event.register}</CardTitle>
              <CardDescription>{dict.event.attend}</CardDescription>
            </CardHeader>
            <CardContent>
              <Link
                href={`/${lang}/login-clerk?from=${encodeURIComponent(
                  `/${lang}/events/${event.slug}`,
                )}`}
                className={cn(buttonVariants())}
              >
                {dict.event.register}
              </Link>
            </CardContent>
          </Card>
        ) : isFull ? (
          <Card>
            <CardContent className="pt-6 text-sm text-muted-foreground">
              {dict.event.full}
            </CardContent>
          </Card>
        ) : (
          <RegistrationForm
            slug={event.slug}
            fields={event.fields.map((field) => ({
              key: field.key,
              label: field.label,
              type: field.type,
              options: field.options,
              required: field.required,
            }))}
            defaults={{ name: user.name ?? "", email: user.email ?? "" }}
            dict={dict.event}
          />
        )}
      </div>
    </div>
  );
}
