import { notFound } from "next/navigation";

import { getCurrentUser } from "@saasfly/auth";

import { AppShell } from "~/components/shell/app-shell";
import type { ShellOrg } from "~/components/shell/org-switcher";
import { i18n, type Locale } from "~/config/i18n-config";
import { getDictionary } from "~/lib/get-dictionary";
import { trpc } from "~/trpc/server";

interface DashboardLayoutProps {
  children?: React.ReactNode;
  params: {
    lang: Locale;
  };
}

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return i18n.locales.map((locale) => ({ lang: locale }));
}

export default async function DashboardLayout({
  children,
  params: { lang },
}: DashboardLayoutProps) {
  const user = await getCurrentUser();
  const dict = await getDictionary(lang);
  if (!user) {
    return notFound();
  }

  const organizations = await trpc.organization.listMine
    .query()
    .catch(() => []);

  const orgs: ShellOrg[] = organizations.map((organization) => ({
    id: organization.id,
    name: organization.name,
    role: organization.role,
    plan: organization.plan,
  }));

  return (
    <AppShell
      user={{ name: user.name, image: user.image, email: user.email }}
      lang={lang}
      orgs={orgs}
      dict={dict.event}
      dropdownDict={dict.dropdown}
      commonDict={dict.common}
      clustersLabel={dict.common.dashboard.sidebar_nav_clusters}
      billingLabel={dict.common.dashboard.sidebar_nav_billing}
      settingsLabel={dict.common.dashboard.sidebar_nav_settings}
    >
      {children}
    </AppShell>
  );
}
