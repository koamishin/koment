import type { MetadataRoute } from "next";
import { i18n } from "~/config/i18n-config";
import { siteConfig } from "~/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = siteConfig.url.replace(/\/$/, "");
  const currentDate = new Date();

  const routes: { path: string; changeFrequency: "always" | "hourly" | "daily" | "weekly" | "monthly"; priority: number }[] = [
    { path: "", changeFrequency: "daily", priority: 1.0 },
    { path: "/tournaments", changeFrequency: "daily", priority: 0.9 },
    { path: "/events", changeFrequency: "daily", priority: 0.9 },
    { path: "/pricing", changeFrequency: "weekly", priority: 0.8 },
    { path: "/blog", changeFrequency: "weekly", priority: 0.7 },
    { path: "/docs", changeFrequency: "monthly", priority: 0.6 },
  ];

  const sitemapEntries: MetadataRoute.Sitemap = [];

  for (const locale of i18n.locales) {
    for (const route of routes) {
      sitemapEntries.push({
        url: `${baseUrl}/${locale}${route.path}`,
        lastModified: currentDate,
        changeFrequency: route.changeFrequency,
        priority: route.priority,
      });
    }
  }

  return sitemapEntries;
}
