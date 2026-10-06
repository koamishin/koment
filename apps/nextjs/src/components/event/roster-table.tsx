"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@saasfly/ui/badge";
import { Button } from "@saasfly/ui/button";
import { Input } from "@saasfly/ui/input";
import * as Icons from "@saasfly/ui/icons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@saasfly/ui/table";
import { toast } from "@saasfly/ui/use-toast";

import { RegistrationStatusBadge } from "~/components/event/event-badges";
import { trpc } from "~/trpc/client";

import type { EventDict } from "~/components/event/dict";

type RegistrationStatusValue =
  | "PENDING"
  | "CONFIRMED"
  | "REJECTED"
  | "CANCELED";

interface RegistrationRow {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  status: RegistrationStatusValue;
  checkedInAt: Date | string | null;
  checkInMethod: "QR" | "MANUAL" | null;
  answers: unknown;
}

interface RosterTableProps {
  organizationId: number;
  eventId: number;
  canApprove: boolean;
  dict: EventDict;
  locale: string;
}

const PAGE_SIZE = 50;

interface RosterFilter {
  key: "ALL" | RegistrationStatusValue;
  labelKey: string;
}

const FILTERS: RosterFilter[] = [
  { key: "ALL", labelKey: "roster" },
  { key: "PENDING", labelKey: "pending_approval" },
  { key: "CONFIRMED", labelKey: "confirmed" },
  { key: "CANCELED", labelKey: "canceled" },
];

function formatAnswers(answers: unknown): string {
  if (!answers || typeof answers !== "object") {
    return "";
  }
  return Object.entries(answers as Record<string, unknown>)
    .filter(([, value]) => value !== null && value !== "")
    .map(([key, value]) => `${key}: ${String(value)}`)
    .join(" · ");
}

export function RosterTable({
  organizationId,
  eventId,
  canApprove,
  dict,
  locale,
}: RosterTableProps) {
  const router = useRouter();
  const [search, setSearch] = React.useState<string>("");
  const [filter, setFilter] = React.useState<"ALL" | RegistrationStatusValue>(
    "ALL",
  );
  const [page, setPage] = React.useState<number>(0);
  const [rows, setRows] = React.useState<RegistrationRow[]>([]);
  const [total, setTotal] = React.useState<number>(0);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);

  const load = React.useCallback(async () => {
    setIsLoading(true);

    try {
      const result = await trpc.registration.roster.query({
        organizationId,
        eventId,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
        search: search || undefined,
        status: filter === "ALL" ? undefined : filter,
      });

      setRows(result.registrations as RegistrationRow[]);
      setTotal(result.total);
    } catch (error) {
      toast({
        title: "Something went wrong.",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, eventId, page, search, filter]);

  React.useEffect(() => {
    const timer = setTimeout(
      () => {
        void load();
      },
      search ? 250 : 0,
    );

    return () => clearTimeout(timer);
  }, [load, search]);

  async function setStatus(
    registrationId: number,
    status: RegistrationStatusValue,
  ) {
    try {
      const response = await trpc.registration.updateStatus.mutate({
        organizationId,
        registrationId,
        status,
      });

      if (!response?.success) {
        return toast({
          title: "Something went wrong.",
          description: "The registration was not updated. Please try again.",
          variant: "destructive",
        });
      }

      await load();
      router.refresh();
      toast({ description: dict.confirmed });
    } catch (error) {
      toast({
        title: "Something went wrong.",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  }

  async function setPresent(registrationId: number, present: boolean) {
    try {
      const response = await trpc.checkIn.setManual.mutate({
        organizationId,
        eventId,
        registrationId,
        present,
      });

      if (!response?.success) {
        return toast({
          title: "Something went wrong.",
          description: "Check-in was not updated. Please try again.",
          variant: "destructive",
        });
      }

      await load();
      router.refresh();
    } catch (error) {
      toast({
        title: "Something went wrong.",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    }
  }

  const pageCount = Math.max(Math.ceil(total / PAGE_SIZE), 1);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Icons.Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(0);
            }}
            placeholder={dict.search_placeholder}
            className="pl-8"
          />
        </div>
        <div className="flex flex-wrap gap-1 rounded-lg border border-border/70 bg-muted/40 p-1">
          {FILTERS.map(({ key, labelKey }) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setFilter(key);
                setPage(0);
              }}
              className={
                filter === key
                  ? "rounded-md bg-background px-3 py-1.5 text-sm font-medium shadow-sm"
                  : "rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              }
            >
              {(dict as Record<string, string>)[labelKey] ?? key}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border/70">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{dict.attendee}</TableHead>
              <TableHead>{dict.status}</TableHead>
              <TableHead>{dict.attendance}</TableHead>
              <TableHead className="text-right">ACTION</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((registration) => {
              const isPresent = Boolean(registration.checkedInAt);
              const isPending = registration.status === "PENDING";
              const answers = formatAnswers(registration.answers);

              return (
                <TableRow key={registration.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{registration.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {registration.email}
                        {registration.phone ? ` · ${registration.phone}` : ""}
                      </span>
                      {answers ? (
                        <span className="mt-1 text-xs text-muted-foreground">
                          {answers}
                        </span>
                      ) : null}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-wrap items-center gap-2">
                      <RegistrationStatusBadge
                        status={registration.status}
                        dict={dict}
                      />
                      {isPending && canApprove ? (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setStatus(registration.id, "CONFIRMED")
                            }
                          >
                            <Icons.Check className="mr-1 h-3.5 w-3.5" />
                            {dict.approve}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setStatus(registration.id, "REJECTED")
                            }
                          >
                            <Icons.Rejected className="mr-1 h-3.5 w-3.5" />
                            {dict.reject}
                          </Button>
                        </>
                      ) : null}
                    </div>
                  </TableCell>

                  <TableCell>
                    {isPresent ? (
                      <div className="flex flex-col">
                        <Badge variant="success">
                          <Icons.Check className="mr-1 h-3 w-3" />
                          {dict.checked_in}
                        </Badge>
                        <span className="mt-1 text-xs text-muted-foreground">
                          {new Date(registration.checkedInAt!).toLocaleString(
                            locale,
                            { timeStyle: "short" },
                          )}
                          {registration.checkInMethod
                            ? ` · ${registration.checkInMethod}`
                            : ""}
                        </span>
                      </div>
                    ) : (
                      <Badge variant="secondary">{dict.not_checked_in}</Badge>
                    )}
                  </TableCell>

                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant={isPresent ? "ghost" : "outline"}
                      onClick={() => setPresent(registration.id, !isPresent)}
                    >
                      {isPresent ? (
                        <>
                          <Icons.Close className="mr-1 h-3.5 w-3.5" />
                          {dict.undo_check_in}
                        </>
                      ) : (
                        <>
                          <Icons.Check className="mr-1 h-3.5 w-3.5" />
                          {dict.mark_present}
                        </>
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {!isLoading && rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-12 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-border/70 bg-muted/40">
              <Icons.Users className="h-5 w-5 text-muted-foreground" />
            </span>
            <p className="text-sm font-medium">{dict.no_registrations_title}</p>
            <p className="max-w-sm text-xs text-muted-foreground">
              {dict.no_registrations_text}
            </p>
          </div>
        ) : null}
      </div>

      {pageCount > 1 ? (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {page + 1} / {pageCount} · {total}
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page === 0}
              onClick={() => setPage((value) => Math.max(value - 1, 0))}
            >
              <Icons.ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page + 1 >= pageCount}
              onClick={() => setPage((value) => value + 1)}
            >
              <Icons.ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
