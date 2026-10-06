import Link from "next/link";

import { Badge } from "@saasfly/ui/badge";
import { buttonVariants } from "@saasfly/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@saasfly/ui/card";
import * as Icons from "@saasfly/ui/icons";
import { cn } from "@saasfly/ui";

import { EmptyPlaceholder } from "~/components/empty-placeholder";
import { CapacityMeter, DateTimeLabel } from "~/components/event/event-badges";
import type { Locale } from "~/config/i18n-config";
import { getDictionary } from "~/lib/get-dictionary";
import { trpc } from "~/trpc/server";

interface EventsPageProps {
  params: { lang: Locale };
}

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Events",
};

export default async function EventsPage({
  params: { lang },
}: EventsPageProps) {
  const [dict, events] = await Promise.all([
    getDictionary(lang),
    trpc.event.listPublic.query(),
  ]);

  return (
    <div className="container py-12">
      <div className="relative mb-10 overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent px-6 py-10 md:px-12 md:py-14">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-primary/20 blur-3xl"
        />
        <div className="relative max-w-2xl space-y-3">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {dict.event.title}
          </p>
          <h1 className="font-heading text-3xl font-semibold leading-tight tracking-tight md:text-4xl">
            {dict.event.browse_events}
          </h1>
          <p className="text-base leading-relaxed text-muted-foreground">
            {dict.event.browse_events_text}
          </p>
        </div>
      </div>

      {events.length ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <Card
              key={event.id}
              className="group flex flex-col overflow-hidden border-border/70 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5"
            >
              <div className="relative">
                {event.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={event.coverImage}
                    alt={event.name}
                    className="h-44 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-44 w-full items-center justify-center bg-gradient-to-br from-primary/25 to-primary/5">
                    <Icons.Calendar className="h-10 w-10 text-primary/50" />
                  </div>
                )}
                {event.requireApproval ? (
                  <Badge
                    variant="warning"
                    className="absolute left-3 top-3 shadow-sm"
                  >
                    {dict.event.require_approval}
                  </Badge>
                ) : null}
              </div>
              <CardHeader>
                <CardTitle className="text-lg">
                  <Link
                    href={`/${lang}/events/${event.slug}`}
                    className="hover:underline"
                  >
                    {event.name}
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-3 text-sm">
                {event.description ? (
                  <p className="line-clamp-3 text-muted-foreground">
                    {event.description}
                  </p>
                ) : null}
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Icons.Clock className="h-3.5 w-3.5 shrink-0" />
                  <DateTimeLabel value={event.startsAt} locale={lang} />
                </div>
                {event.location ? (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Icons.MapPin className="h-3.5 w-3.5 shrink-0" />
                    {event.location}
                  </div>
                ) : null}
                <div className="mt-auto flex items-center justify-between gap-2 pt-4">
                  <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                    <Icons.Organization className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{event.organizationName}</span>
                  </span>
                  <CapacityMeter
                    used={event.capacity ? event.confirmedCount : 0}
                    capacity={event.capacity}
                    dict={dict.event}
                    compact
                  />
                </div>
                <Link
                  href={`/${lang}/events/${event.slug}`}
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "mt-2 w-full",
                  )}
                >
                  {dict.event.attend}
                  <Icons.ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyPlaceholder>
          <EmptyPlaceholder.Icon name="Calendar" />
          <EmptyPlaceholder.Title>
            {dict.event.no_public_events_title}
          </EmptyPlaceholder.Title>
          <EmptyPlaceholder.Description>
            {dict.event.no_public_events_text}
          </EmptyPlaceholder.Description>
        </EmptyPlaceholder>
      )}
    </div>
  );
}
