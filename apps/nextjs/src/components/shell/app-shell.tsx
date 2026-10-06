"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { cn } from "@saasfly/ui";
import { Button } from "@saasfly/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@saasfly/ui/dropdown-menu";
import * as Icons from "@saasfly/ui/icons";
import { Separator } from "@saasfly/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@saasfly/ui/sheet";

import type { EventDict } from "~/components/event/dict";
import { ModeToggle } from "~/components/mode-toggle";
import { AppBreadcrumb } from "~/components/shell/app-breadcrumb";
import {
  OrgSwitcher,
  TenantPlanBadge,
  useCurrentOrgId,
  type ShellOrg,
} from "~/components/shell/org-switcher";
import { SiteFooter } from "~/components/site-footer";
import { UserAccountNav } from "~/components/user-account-nav";
import { i18n } from "~/config/i18n-config";

interface NavEntry {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: (pathname: string) => boolean;
}

interface AppShellProps {
  user: {
    name?: string | null;
    image?: string | null;
    email?: string | null;
  };
  lang: string;
  orgs: ShellOrg[];
  dict: EventDict;
  dropdownDict: Record<string, string>;
  commonDict: Record<string, string | Record<string, string>>;
  clustersLabel: string;
  billingLabel: string;
  settingsLabel: string;
  children: React.ReactNode;
}

function buildNav(
  lang: string,
  currentOrgId: number | null,
  labels: {
    dict: EventDict;
    clustersLabel: string;
    billingLabel: string;
    settingsLabel: string;
  },
): { section: string; entries: NavEntry[] }[] {
  const { dict, billingLabel, settingsLabel } = labels;
  const orgBase =
    currentOrgId !== null
      ? `/${lang}/dashboard/organizations/${currentOrgId}`
      : null;

  const groups: { section: string; entries: NavEntry[] }[] = [
    {
      section: dict.title,
      entries: [
        {
          href: `/${lang}/dashboard`,
          label: "Dashboard",
          icon: Icons.Dashboard,
          active: (pathname) =>
            pathname === `/${lang}/dashboard` ||
            pathname === `/${lang}/dashboard/`,
        },
        {
          href: `/${lang}/dashboard/tournaments`,
          label: "Tournaments",
          icon: Icons.Trophy,
          active: (pathname) =>
            pathname === `/${lang}/dashboard/tournaments` ||
            pathname.startsWith(`/${lang}/dashboard/tournaments/`),
        },
        {
          href: `/${lang}/events`,
          label: dict.browse_events,
          icon: Icons.Calendar,
          active: (pathname) =>
            pathname === `/${lang}/events` ||
            pathname.startsWith(`/${lang}/events/`),
        },
        {
          href: `/${lang}/dashboard/registrations`,
          label: dict.my_registrations,
          icon: Icons.Ticket,
          active: (pathname) =>
            pathname.startsWith(`/${lang}/dashboard/registrations`),
        },
      ],
    },
  ];

  if (orgBase) {
    groups.push({
      section: dict.workspace,
      entries: [
        {
          href: orgBase,
          label: dict.overview,
          icon: Icons.Dashboard,
          active: (pathname) => pathname === orgBase,
        },
        {
          href: `${orgBase}/tournaments`,
          label: "Tournaments",
          icon: Icons.Swords,
          active: (pathname) => pathname.startsWith(`${orgBase}/tournaments`),
        },
        {
          href: `${orgBase}/members`,
          label: dict.members,
          icon: Icons.Users,
          active: (pathname) => pathname.startsWith(`${orgBase}/members`),
        },
      ],
    });
  }

  groups.push({
    section: dict.manage,
    entries: [
      {
        href: `/${lang}/dashboard/organizations`,
        label: dict.orgs,
        icon: Icons.Organization,
        active: (pathname) => pathname === `/${lang}/dashboard/organizations`,
      },
      {
        href: `/${lang}/dashboard/billing`,
        label: billingLabel,
        icon: Icons.Billing,
        active: (pathname) => pathname.startsWith(`/${lang}/dashboard/billing`),
      },
      {
        href: `/${lang}/dashboard/settings`,
        label: settingsLabel,
        icon: Icons.Settings,
        active: (pathname) =>
          pathname.startsWith(`/${lang}/dashboard/settings`),
      },
    ],
  });

  return groups;
}

function SidebarNav({
  lang,
  orgs,
  currentOrgId,
  dict,
  clustersLabel,
  billingLabel,
  settingsLabel,
  onNavigate,
}: {
  lang: string;
  orgs: ShellOrg[];
  currentOrgId: number | null;
  dict: EventDict;
  clustersLabel: string;
  billingLabel: string;
  settingsLabel: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const groups = React.useMemo(
    () =>
      buildNav(lang, currentOrgId, {
        dict,
        clustersLabel,
        billingLabel,
        settingsLabel,
      }),
    [lang, currentOrgId, dict, clustersLabel, billingLabel, settingsLabel],
  );

  return (
    <nav className="grid items-start gap-5 px-2">
      {groups.map((group) => (
        <div key={group.section} className="grid gap-1">
          <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">
            {group.section}
          </p>
          {group.entries.map((entry) => {
            const Icon = entry.icon;
            const isActive = entry.active(pathname);
            return (
              <Link
                key={entry.href}
                href={entry.href}
                onClick={onNavigate}
                className={cn(
                  "group relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                  isActive
                    ? "bg-primary/12 font-medium text-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                {isActive ? (
                  <span
                    aria-hidden
                    className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-primary"
                  />
                ) : null}
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-colors",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground group-hover:text-foreground",
                  )}
                />
                <span className="truncate">{entry.label}</span>
              </Link>
            );
          })}
        </div>
      ))}
      {orgs.length === 0 ? (
        <p className="px-3 text-xs text-muted-foreground">
          {dict.no_orgs_text}
        </p>
      ) : null}
    </nav>
  );
}

function LocaleSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const stripped = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, "") || "/";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 px-0">
          <Icons.Languages className="h-4 w-4" />
          <span className="sr-only">Language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {i18n.locales.map((locale) => (
          <DropdownMenuItem
            key={locale}
            onClick={() => router.push(`/${locale}${stripped}`)}
          >
            <span>{locale.toUpperCase()}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppShell({
  user,
  lang,
  orgs,
  dict,
  dropdownDict,
  commonDict,
  clustersLabel,
  billingLabel,
  settingsLabel,
  children,
}: AppShellProps) {
  const currentOrgId = useCurrentOrgId();
  const [mobileOpen, setMobileOpen] = React.useState<boolean>(false);

  const sidebarBody = (
    <div className="flex h-full flex-col gap-4 py-4">
      <div className="px-2">
        <OrgSwitcher
          orgs={orgs}
          currentOrgId={currentOrgId}
          lang={lang}
          dict={dict}
        />
      </div>
      <Separator />
      <div className="flex-1 overflow-y-auto">
        <SidebarNav
          lang={lang}
          orgs={orgs}
          currentOrgId={currentOrgId}
          dict={dict}
          clustersLabel={clustersLabel}
          billingLabel={billingLabel}
          settingsLabel={settingsLabel}
          onNavigate={() => setMobileOpen(false)}
        />
      </div>
      {currentOrgId !== null ? (
        <>
          <Separator />
          <div className="flex items-center justify-between px-4">
            <TenantPlanBadge orgs={orgs} currentOrgId={currentOrgId} />
            <span className="text-xs text-muted-foreground">
              {orgs.length} {dict.orgs.toLowerCase()}
            </span>
          </div>
        </>
      ) : null}
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/65">
        <div className="container flex h-16 items-center gap-3">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 px-0 md:hidden"
              >
                <Icons.Menu className="h-4 w-4" />
                <span className="sr-only">Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent position="left" size="content" className="w-72 p-0">
              <SheetHeader className="px-4 pt-4 text-left">
                <SheetTitle>{dict.orgs}</SheetTitle>
              </SheetHeader>
              {sidebarBody}
            </SheetContent>
          </Sheet>

          <div className="hidden min-w-0 flex-1 md:block">
            <AppBreadcrumb
              lang={lang}
              orgs={orgs}
              dict={dict}
              dashboardLabel={clustersLabel}
              billingLabel={billingLabel}
              settingsLabel={settingsLabel}
            />
          </div>
          <div className="ml-auto flex items-center gap-1">
            <LocaleSwitcher />
            <ModeToggle />
            <UserAccountNav
              user={{ name: user.name, image: user.image, email: user.email }}
              params={{ lang }}
              dict={dropdownDict}
            />
          </div>
        </div>
      </header>

      <div className="relative flex-1">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-[radial-gradient(60%_100%_at_50%_0%,hsl(var(--primary)/0.10),transparent_70%)]"
        />
        <div className="container flex gap-8 py-8">
          <aside className="hidden w-60 shrink-0 md:block xl:w-64">
            <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto rounded-xl border border-border/60 bg-card/40 backdrop-blur-sm">
              {sidebarBody}
            </div>
          </aside>
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>

      <SiteFooter
        className="border-t border-border"
        params={{ lang }}
        dict={commonDict}
      />
    </div>
  );
}
