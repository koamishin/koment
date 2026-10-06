import type { Locale } from "~/config/i18n-config";
import { getDictionary } from "~/lib/get-dictionary";
import type { DashboardConfig } from "~/types";

export const getDashboardConfig = async ({
  params: { lang },
}: {
  params: {
    lang: Locale;
  };
}): Promise<DashboardConfig> => {
  const dict = await getDictionary(lang);

  return {
    mainNav: [
      {
        title: dict.common.dashboard.main_nav_documentation,
        href: "/docs",
      },
      {
        title: dict.common.dashboard.main_nav_support,
        href: "/support",
        disabled: true,
      },
    ],
    sidebarNav: [
      {
        id: "dashboard",
        title: "Overview",
        href: "/dashboard",
      },
      {
        id: "tournaments",
        title: "Tournaments",
        href: "/dashboard/tournaments",
      },
      {
        id: "events",
        title: dict.event.browse_events,
        href: "/events",
      },
      {
        id: "registrations",
        title: dict.event.my_registrations,
        href: "/dashboard/registrations",
      },
      {
        id: "organizations",
        title: dict.event.orgs,
        href: "/dashboard/organizations",
      },
      {
        id: "billing",
        title: dict.common.dashboard.sidebar_nav_billing,
        href: "/dashboard/billing",
      },
      {
        id: "settings",
        title: dict.common.dashboard.sidebar_nav_settings,
        href: "/dashboard/settings",
      },
    ],
  };
};
