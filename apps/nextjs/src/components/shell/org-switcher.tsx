"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Badge } from "@saasfly/ui/badge";
import { Button } from "@saasfly/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@saasfly/ui/dropdown-menu";
import * as Icons from "@saasfly/ui/icons";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@saasfly/ui/tooltip";

import type { EventDict } from "~/components/event/dict";

export interface ShellOrg {
  id: number;
  name: string;
  role: string;
  plan: string;
}

interface OrgSwitcherProps {
  orgs: ShellOrg[];
  currentOrgId: number | null;
  lang: string;
  dict: EventDict;
}

function roleLabel(role: string, dict: EventDict): string {
  const labels: Record<string, string> = {
    OWNER: dict.role_owner,
    ADMIN: dict.role_admin,
    STAFF: dict.role_staff,
    MEMBER: dict.role_member,
  };
  return labels[role] ?? role;
}

export function OrgSwitcher({
  orgs,
  currentOrgId,
  lang,
  dict,
}: OrgSwitcherProps) {
  const current = orgs.find((org) => org.id === currentOrgId) ?? null;

  return (
    <DropdownMenu>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="group h-auto w-full justify-start gap-2.5 rounded-xl border-border/70 bg-card/60 py-2.5 text-left shadow-sm transition-colors hover:border-primary/40 hover:bg-accent/60"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/70 text-xs font-bold text-primary-foreground shadow-sm">
                  {current ? current.name.slice(0, 1).toUpperCase() : "…"}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-left text-sm font-semibold leading-tight">
                    {current ? current.name : dict.orgs}
                  </span>
                  <span className="block text-left text-[11px] leading-tight text-muted-foreground">
                    {current
                      ? `${dict.workspace} · ${roleLabel(current.role, dict)}`
                      : dict.create_first_org}
                  </span>
                </span>
                <Icons.ChevronRight className="h-4 w-4 shrink-0 rotate-90 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="right">
            {dict.orgs_title}: {current ? current.name : "—"}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>{dict.orgs_title}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {orgs.map((org) => (
          <DropdownMenuItem key={org.id} asChild>
            <Link
              href={`/${lang}/dashboard/organizations/${org.id}`}
              className="flex items-center gap-2"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/90 to-primary/60 text-[11px] font-bold text-primary-foreground">
                {org.name.slice(0, 1).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate">{org.name}</span>
                <span className="block text-xs text-muted-foreground">
                  {roleLabel(org.role, dict)} · {org.plan}
                </span>
              </span>
              {org.id === currentOrgId ? (
                <Icons.Check className="h-4 w-4 shrink-0" />
              ) : null}
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link
            href={`/${lang}/dashboard/organizations`}
            className="flex items-center gap-2"
          >
            <Icons.Settings className="h-4 w-4" />
            {dict.orgs}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link
            href={`/${lang}/dashboard/registrations`}
            className="flex items-center gap-2"
          >
            <Icons.Ticket className="h-4 w-4" />
            {dict.my_registrations}
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface TenantPlanBadgeProps {
  orgs: ShellOrg[];
  currentOrgId: number | null;
}

export function TenantPlanBadge({ orgs, currentOrgId }: TenantPlanBadgeProps) {
  const current = orgs.find((org) => org.id === currentOrgId) ?? null;
  if (!current) {
    return null;
  }
  return (
    <Badge variant={current.plan === "FREE" ? "secondary" : "default"}>
      {current.plan}
    </Badge>
  );
}

export function useCurrentOrgId(): number | null {
  const pathname = usePathname();
  const match = pathname.match(/\/organizations\/(\d+)/);
  const id = match?.[1] ? Number(match[1]) : NaN;
  return Number.isInteger(id) && id > 0 ? id : null;
}
