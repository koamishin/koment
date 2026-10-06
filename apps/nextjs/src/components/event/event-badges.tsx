import { Badge } from "@saasfly/ui/badge";
import { cn } from "@saasfly/ui";

import {
  EventStatus,
  RegistrationStatus,
  SubscriptionPlan,
} from "@saasfly/db/enums";

import type { Locale } from "~/config/i18n-config";

type Dict = Record<string, string>;

const eventStatusStyle: Record<
  EventStatus,
  { variant: "secondary" | "success" | "warning" | "destructive"; dot: string }
> = {
  [EventStatus.DRAFT]: { variant: "secondary", dot: "bg-muted-foreground" },
  [EventStatus.PUBLISHED]: {
    variant: "success",
    dot: "bg-green-500",
  },
  [EventStatus.CANCELED]: { variant: "destructive", dot: "bg-destructive" },
  [EventStatus.COMPLETED]: { variant: "warning", dot: "bg-amber-500" },
};

const eventStatusKey: Record<EventStatus, string> = {
  [EventStatus.DRAFT]: "status_draft",
  [EventStatus.PUBLISHED]: "status_published",
  [EventStatus.CANCELED]: "status_canceled",
  [EventStatus.COMPLETED]: "status_completed",
};

const registrationStatusStyle: Record<
  RegistrationStatus,
  { variant: "secondary" | "success" | "warning" | "destructive"; dot: string }
> = {
  [RegistrationStatus.PENDING]: { variant: "warning", dot: "bg-amber-500" },
  [RegistrationStatus.CONFIRMED]: {
    variant: "success",
    dot: "bg-green-500",
  },
  [RegistrationStatus.REJECTED]: {
    variant: "destructive",
    dot: "bg-destructive",
  },
  [RegistrationStatus.CANCELED]: {
    variant: "secondary",
    dot: "bg-muted-foreground",
  },
};

const registrationStatusKey: Record<RegistrationStatus, string> = {
  [RegistrationStatus.PENDING]: "pending_approval",
  [RegistrationStatus.CONFIRMED]: "confirmed",
  [RegistrationStatus.REJECTED]: "rejected",
  [RegistrationStatus.CANCELED]: "canceled",
};

interface EventStatusBadgeProps {
  status: EventStatus;
  dict: Dict;
}

export function EventStatusBadge({ status, dict }: EventStatusBadgeProps) {
  const style = eventStatusStyle[status];
  return (
    <Badge variant={style.variant} className="gap-1.5">
      <span className={cn("h-1.5 w-1.5 rounded-full", style.dot)} />
      {dict[eventStatusKey[status]] ?? status}
    </Badge>
  );
}

interface RegistrationStatusBadgeProps {
  status: RegistrationStatus;
  dict: Dict;
}

export function RegistrationStatusBadge({
  status,
  dict,
}: RegistrationStatusBadgeProps) {
  const style = registrationStatusStyle[status];
  return (
    <Badge variant={style.variant} className="gap-1.5">
      <span className={cn("h-1.5 w-1.5 rounded-full", style.dot)} />
      {dict[registrationStatusKey[status]] ?? status}
    </Badge>
  );
}

interface PlanBadgeProps {
  plan: SubscriptionPlan;
}

export function PlanBadge({ plan }: PlanBadgeProps) {
  return (
    <Badge
      variant={plan === SubscriptionPlan.FREE ? "secondary" : "default"}
      className="gap-1.5 font-medium"
    >
      {plan !== SubscriptionPlan.FREE ? (
        <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground/80" />
      ) : null}
      {plan}
    </Badge>
  );
}

interface CapacityMeterProps {
  used: number;
  capacity: number | null;
  dict: Dict;
  compact?: boolean;
}

export function CapacityMeter({
  used,
  capacity,
  dict,
  compact,
}: CapacityMeterProps) {
  if (capacity === null) {
    return (
      <span className="text-muted-foreground">
        {used} · {dict.unlimited}
      </span>
    );
  }

  const left = Math.max(capacity - used, 0);
  const pct = capacity > 0 ? Math.min((used / capacity) * 100, 100) : 0;
  const isFull = left === 0;

  if (compact) {
    return (
      <div className="flex w-32 flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs tabular-nums">
          <span className={isFull ? "text-destructive" : "text-foreground"}>
            {used}/{capacity}
          </span>
          <span className="text-muted-foreground">
            {isFull ? dict.full : `${left} ${dict.spots_left}`}
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              isFull ? "bg-destructive" : "bg-primary",
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-1.5">
      <div className="flex items-center justify-between text-xs tabular-nums">
        <span className="text-muted-foreground">
          {used}/{capacity}
        </span>
        <span className={isFull ? "text-destructive" : "text-muted-foreground"}>
          {isFull ? dict.full : `${left} ${dict.spots_left}`}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            isFull ? "bg-destructive" : "bg-primary",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

interface DateTimeLabelProps {
  value: Date | string;
  locale: Locale;
}

export function DateTimeLabel({ value, locale }: DateTimeLabelProps) {
  const date = new Date(value);
  return (
    <time dateTime={date.toISOString()}>
      {date.toLocaleString(locale, {
        dateStyle: "medium",
        timeStyle: "short",
      })}
    </time>
  );
}
