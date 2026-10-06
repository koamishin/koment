import Link from "next/link";
import * as Icons from "@saasfly/ui/icons";
import { ModeToggle } from "~/components/mode-toggle";
import { i18n, type Locale } from "~/config/i18n-config";

interface PortalLayoutProps {
  children: React.ReactNode;
  params: { lang: Locale };
}

export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return i18n.locales.map((locale) => ({ lang: locale }));
}

export default function PortalLayout({
  children,
  params: { lang },
}: PortalLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Clean Distraction-Free Header (No Marketing Navigation Menus) */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="container flex h-14 items-center justify-between">
          <Link
            href={`/${lang}/tournaments`}
            className="flex items-center gap-2 font-black tracking-tight text-base hover:opacity-90 transition-opacity"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Icons.Trophy className="h-4 w-4" />
            </span>
            <span>KoaTournament</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href={`/${lang}/tournaments`}
              className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <Icons.ChevronLeft className="h-3.5 w-3.5" />
              All Tournaments
            </Link>
            <ModeToggle />
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border/40 py-6 text-center text-xs text-muted-foreground">
        <p>KoaTournament • Student & Campus Esports</p>
      </footer>
    </div>
  );
}
