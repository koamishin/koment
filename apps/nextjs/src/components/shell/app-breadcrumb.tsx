"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@saasfly/ui/breadcrumb";

import type { EventDict } from "~/components/event/dict";
import type { ShellOrg } from "~/components/shell/org-switcher";

interface Crumb {
  label: string;
  href?: string;
}

interface AppBreadcrumbProps {
  lang: string;
  orgs: ShellOrg[];
  dict: EventDict;
  dashboardLabel: string;
  billingLabel: string;
  settingsLabel: string;
}

function buildCrumbs(
  pathname: string,
  lang: string,
  orgs: ShellOrg[],
  labels: {
    dict: EventDict;
    dashboardLabel: string;
    billingLabel: string;
    settingsLabel: string;
  },
): Crumb[] {
  const { dict, dashboardLabel, billingLabel, settingsLabel } = labels;
  const segments = pathname.split("/").filter(Boolean).slice(1);
  const crumbs: Crumb[] = [];

  if (segments[0] !== "dashboard") {
    return crumbs;
  }

  const rest = segments.slice(1);
  if (rest.length === 0) {
    crumbs.push({ label: dashboardLabel });
    return crumbs;
  }

  const orgName = (id: number) =>
    orgs.find((org) => org.id === id)?.name ?? dict.orgs;

  let i = 0;
  while (i < rest.length) {
    const segment = rest[i];

    if (segment === "organizations") {
      const id = Number(rest[i + 1]);
      if (Number.isInteger(id) && id > 0) {
        crumbs.push({
          label: dict.orgs,
          href: `/${lang}/dashboard/organizations`,
        });
        crumbs.push({ label: orgName(id) });
        i += 2;
        continue;
      }
      crumbs.push({ label: dict.orgs });
      i += 1;
      continue;
    }

    if (segment === "events" && i > 0 && rest[i - 2] === "organizations") {
      const id = Number(rest[i + 1]);
      if (Number.isInteger(id) && id > 0) {
        crumbs.push({ label: dict.title });
        crumbs.push({ label: dict.view_pass });
        i += 2;
        continue;
      }
      crumbs.push({ label: dict.title });
      i += 1;
      continue;
    }

    if (segment === "members") {
      crumbs.push({ label: dict.members });
      i += 1;
      continue;
    }

    if (segment === "edit") {
      crumbs.push({ label: dict.save_event });
      i += 1;
      continue;
    }

    if (segment === "events") {
      crumbs.push({
        label: dict.browse_events,
        href: `/${lang}/events`,
      });
      i += 1;
      continue;
    }

    if (segment === "registrations") {
      crumbs.push({ label: dict.my_registrations });
      i += 1;
      continue;
    }

    if (segment === "billing") {
      crumbs.push({ label: billingLabel });
      i += 1;
      continue;
    }

    if (segment === "settings") {
      crumbs.push({ label: settingsLabel });
      i += 1;
      continue;
    }

    i += 1;
  }

  return crumbs;
}

export function AppBreadcrumb({
  lang,
  orgs,
  dict,
  dashboardLabel,
  billingLabel,
  settingsLabel,
}: AppBreadcrumbProps) {
  const pathname = usePathname();
  const crumbs = React.useMemo(
    () =>
      buildCrumbs(pathname, lang, orgs, {
        dict,
        dashboardLabel,
        billingLabel,
        settingsLabel,
      }),
    [pathname, lang, orgs, dict, dashboardLabel, billingLabel, settingsLabel],
  );

  if (crumbs.length === 0) {
    return null;
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <React.Fragment key={`${crumb.label}-${index}`}>
              {index > 0 ? <BreadcrumbSeparator /> : null}
              <BreadcrumbItem>
                {isLast || !crumb.href ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={crumb.href}>{crumb.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
