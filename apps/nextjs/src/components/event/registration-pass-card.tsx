import { Badge } from "@saasfly/ui/badge";
import { buttonVariants } from "@saasfly/ui/button";
import { cn } from "@saasfly/ui";
import * as Icons from "@saasfly/ui/icons";
import Link from "next/link";

import type { EventDict } from "~/components/event/dict";
import {
  DateTimeLabel,
  RegistrationStatusBadge,
} from "~/components/event/event-badges";
import { QrPass } from "~/components/event/qr-pass";
import { CancelRegistrationButton } from "~/components/event/registration-form";
import type { Locale } from "~/config/i18n-config";

interface RegistrationPassCardProps {
  registration: {
    id: number;
    status: "PENDING" | "CONFIRMED" | "REJECTED" | "CANCELED";
    checkInCode: string;
    checkedInAt: Date | string | null;
    eventName: string;
    startsAt: Date | string;
    endsAt: Date | string | null;
    location: string | null;
    organizationName: string;
    eventSlug: string;
    eventStatus: "DRAFT" | "PUBLISHED" | "CANCELED" | "COMPLETED";
  };
  dict: EventDict;
  lang: Locale;
}

export function RegistrationPassCard({
  registration,
  dict,
  lang,
}: RegistrationPassCardProps) {
  const isPast =
    registration.eventStatus === "COMPLETED" ||
    new Date(registration.startsAt).getTime() < Date.now();
  const isCanceled = registration.status === "CANCELED";
  const isRejected = registration.status === "REJECTED";
  const isPending = registration.status === "PENDING";
  const showPass = !isCanceled && !isRejected && !isPast;

  return (
    <article
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5",
        isPast && "opacity-75",
      )}
    >
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/20 via-primary/8 to-transparent p-5">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-primary/20 blur-3xl"
        />
        <div className="relative space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {registration.organizationName}
              </p>
              <h3 className="truncate font-heading text-lg font-semibold leading-tight">
                {registration.eventName}
              </h3>
            </div>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-background/60">
              <Icons.Calendar className="h-5 w-5 text-primary" />
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <RegistrationStatusBadge status={registration.status} dict={dict} />
            {registration.checkedInAt ? (
              <Badge variant="success" className="gap-1">
                <Icons.Check className="h-3 w-3" />
                {dict.checked_in}
              </Badge>
            ) : null}
            {isPast ? <Badge variant="secondary">{dict.past}</Badge> : null}
          </div>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 pt-1 text-sm">
            <div className="col-span-2 flex items-center gap-2">
              <Icons.Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <dt className="sr-only">{dict.starts_at}</dt>
              <dd>
                <DateTimeLabel value={registration.startsAt} locale={lang} />
              </dd>
            </div>
            {registration.location ? (
              <div className="col-span-2 flex items-center gap-2">
                <Icons.MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <dt className="sr-only">{dict.location}</dt>
                <dd className="truncate text-muted-foreground">
                  {registration.location}
                </dd>
              </div>
            ) : null}
          </dl>
        </div>
      </div>

      <div className="relative flex items-center gap-3 px-5">
        <span className="-left-3 h-6 w-6 shrink-0 rounded-full border border-r-0 border-border/70 bg-background" />
        <span className="h-px flex-1 border-t border-dashed border-border" />
        <span className="-right-3 h-6 w-6 shrink-0 rounded-full border border-l-0 border-border/70 bg-background" />
      </div>

      {showPass ? (
        <div className="flex flex-col items-center gap-3 bg-white px-5 py-6">
          <div className="rounded-xl bg-white p-3 shadow-[0_0_0_1px_rgba(0,0,0,0.06),0_8px_24px_-8px_rgba(0,0,0,0.25)]">
            <QrPass code={registration.checkInCode} size={168} />
          </div>
          <div className="text-center">
            <p className="font-mono text-sm font-semibold tracking-[0.3em] text-black">
              {registration.checkInCode}
            </p>
            <p className="mt-1 text-[11px] uppercase tracking-wider text-black/45">
              {dict.check_in}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 border-t border-dashed border-border/60 bg-muted/30 px-5 py-8 text-center">
          <Icons.Ticket className="h-7 w-7 text-muted-foreground" />
          <p className="max-w-[24ch] text-sm text-muted-foreground">
            {isPending
              ? dict.registered_pending
              : isRejected
                ? dict.rejected
                : isCanceled
                  ? dict.canceled
                  : dict.past}
          </p>
        </div>
      )}

      <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-border/60 px-5 py-3">
        <Link
          href={`/${lang}/events/${registration.eventSlug}`}
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
        >
          {dict.browse_events}
          <Icons.ArrowRight className="ml-2 h-3.5 w-3.5" />
        </Link>
        {!isCanceled && !isPast ? (
          <div className="ml-auto">
            <CancelRegistrationButton
              registrationId={registration.id}
              dict={dict}
            />
          </div>
        ) : null}
      </div>
    </article>
  );
}
