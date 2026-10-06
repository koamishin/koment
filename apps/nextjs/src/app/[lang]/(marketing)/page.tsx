import Link from "next/link";
import type { Locale } from "~/config/i18n-config";
import { buttonVariants } from "@saasfly/ui/button";
import { Badge } from "@saasfly/ui/badge";
import { ColourfulText } from "@saasfly/ui/colorful-text";
import * as Icons from "@saasfly/ui/icons";
import { cn } from "@saasfly/ui";
import { InteractiveBracketPreview } from "~/components/tournament/interactive-bracket-preview";

const SUPPORTED_GAMES = [
  { name: "Valorant", tag: "Tactical FPS", color: "from-rose-500/20 to-rose-600/10" },
  { name: "Counter-Strike 2", tag: "Tactical FPS", color: "from-orange-500/20 to-orange-600/10" },
  { name: "League of Legends", tag: "MOBA", color: "from-amber-500/20 to-amber-600/10" },
  { name: "Rocket League", tag: "Sports / Action", color: "from-blue-500/20 to-blue-600/10" },
  { name: "Dota 2", tag: "MOBA", color: "from-red-500/20 to-red-600/10" },
  { name: "Smash Bros. Ultimate", tag: "Fighting", color: "from-yellow-500/20 to-yellow-600/10" },
  { name: "Apex Legends", tag: "Battle Royale", color: "from-emerald-500/20 to-emerald-600/10" },
  { name: "EA Sports FC 25", tag: "Sports Sim", color: "from-cyan-500/20 to-cyan-600/10" },
];

export default function IndexPage({
  params: { lang },
}: {
  params: {
    lang: Locale;
  };
}) {
  return (
    <div className="flex flex-col gap-20 pb-20 overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-12 md:pt-20">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
        >
          <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-primary to-purple-600 opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" />
        </div>

        <div className="container flex flex-col items-center text-center space-y-6 max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary backdrop-blur-md shadow-sm">
            <Icons.Trophy className="h-4 w-4 text-amber-500" />
            <span>KoaTournament SaaS • Event & Esports Engine</span>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight text-foreground leading-[1.1]">
            The Modern Platform for Live Events &amp;{" "}
            <ColourfulText text="Esports Tournaments" />
          </h1>

          <p className="text-base md:text-xl text-muted-foreground max-w-2xl leading-relaxed">
            From local gaming LANs to global esports championships and corporate conventions.
            Automate single &amp; double elimination brackets, customize registration forms,
            seed teams, and scan QR passes at the door.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              href={`/${lang}/tournaments`}
              className={cn(
                buttonVariants({ variant: "default", size: "lg" }),
                "rounded-full px-8 text-base font-bold shadow-xl shadow-primary/25 gap-2",
              )}
            >
              <Icons.Swords className="h-5 w-5" />
              Explore Tournaments
            </Link>
            <Link
              href={`/${lang}/dashboard`}
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "rounded-full px-8 text-base font-semibold gap-2 border-border/80 backdrop-blur-sm",
              )}
            >
              <Icons.Dashboard className="h-5 w-5" />
              Open Organizer Dashboard
            </Link>
          </div>

          <div className="flex items-center gap-6 pt-4 text-xs font-medium text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Icons.Check className="h-4 w-4 text-emerald-500" />
              Automated Brackets
            </div>
            <div className="flex items-center gap-1.5">
              <Icons.Check className="h-4 w-4 text-emerald-500" />
              Rapid QR Check-in
            </div>
            <div className="flex items-center gap-1.5">
              <Icons.Check className="h-4 w-4 text-emerald-500" />
              Multi-Tenant Workspaces
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Bracket Showcase */}
      <section className="container">
        <div className="space-y-4 max-w-5xl mx-auto">
          <div className="text-center space-y-2 mb-8">
            <Badge variant="outline" className="font-mono text-xs uppercase text-primary">
              Live Product Experience
            </Badge>
            <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight">
              Interactive Esports Bracket Maker
            </h2>
            <p className="text-sm text-muted-foreground max-w-lg mx-auto">
              Test out match progression right now. Click on match scores to advance winners through quarterfinals, semifinals, and grand finals.
            </p>
          </div>

          <InteractiveBracketPreview />
        </div>
      </section>

      {/* Supported Games Ribbon */}
      <section className="container">
        <div className="rounded-3xl border border-border/70 bg-card/40 p-6 md:p-8 backdrop-blur-sm">
          <div className="text-center space-y-1 mb-6">
            <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
              Universal Game Support
            </span>
            <h3 className="text-xl font-bold">Host Competitions for Any Title</h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {SUPPORTED_GAMES.map((game) => (
              <div
                key={game.name}
                className={cn(
                  "flex flex-col justify-between rounded-xl border border-border/60 bg-gradient-to-br p-3.5 transition-all hover:scale-102 hover:border-primary/40",
                  game.color,
                )}
              >
                <span className="text-[10px] font-mono uppercase text-muted-foreground">
                  {game.tag}
                </span>
                <span className="font-bold text-sm text-foreground mt-2">
                  {game.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4 Feature Pillars */}
      <section id="features" className="container space-y-10">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <Badge variant="outline" className="font-mono text-xs uppercase text-primary">
            Platform Capabilities
          </Badge>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Built for Serious Organizers &amp; Players
          </h2>
          <p className="text-sm text-muted-foreground">
            Everything required to launch, administer, and broadcast competitive events without spreadsheets.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Card 1 */}
          <div className="flex flex-col justify-between rounded-2xl border border-border/70 bg-card/60 p-6 backdrop-blur-sm shadow-sm transition-all hover:border-primary/50 hover:shadow-lg">
            <div className="space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icons.Swords className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold">Bracket Generator</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Generate power-of-2 single elimination brackets in one click. Automatic bye routing, seed assignments, and winner progression to the next round.
              </p>
            </div>
            <div className="pt-4 border-t border-border/50 text-xs font-semibold text-primary flex items-center gap-1">
              <span>Seeding &amp; Advancement</span>
              <Icons.ArrowRight className="h-3.5 w-3.5" />
            </div>
          </div>

          {/* Card 2 */}
          <div className="flex flex-col justify-between rounded-2xl border border-border/70 bg-card/60 p-6 backdrop-blur-sm shadow-sm transition-all hover:border-blue-500/50 hover:shadow-lg">
            <div className="space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
                <Icons.Calendar className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold">Custom Registrations</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Build bespoke registration forms with custom fields (Discord tags, game ranks, dietary requirements), capacity limits, and approval queues.
              </p>
            </div>
            <div className="pt-4 border-t border-border/50 text-xs font-semibold text-blue-500 flex items-center gap-1">
              <span>Dynamic Form Engine</span>
              <Icons.ArrowRight className="h-3.5 w-3.5" />
            </div>
          </div>

          {/* Card 3 */}
          <div className="flex flex-col justify-between rounded-2xl border border-border/70 bg-card/60 p-6 backdrop-blur-sm shadow-sm transition-all hover:border-emerald-500/50 hover:shadow-lg">
            <div className="space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                <Icons.CheckIn className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold">Instant Door Check-in</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Unique QR codes for every attendee. Camera scanning or manual fast-code verification at the door to eliminate check-in queues.
              </p>
            </div>
            <div className="pt-4 border-t border-border/50 text-xs font-semibold text-emerald-500 flex items-center gap-1">
              <span>Zero Line Delays</span>
              <Icons.ArrowRight className="h-3.5 w-3.5" />
            </div>
          </div>

          {/* Card 4 */}
          <div className="flex flex-col justify-between rounded-2xl border border-border/70 bg-card/60 p-6 backdrop-blur-sm shadow-sm transition-all hover:border-purple-500/50 hover:shadow-lg">
            <div className="space-y-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-500">
                <Icons.Organization className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold">Workspaces &amp; Roles</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Multi-tenant organization management. Delegate staff permissions, invite co-organizers, and manage multiple tournaments seamlessly.
              </p>
            </div>
            <div className="pt-4 border-t border-border/50 text-xs font-semibold text-purple-500 flex items-center gap-1">
              <span>Role-Based Access</span>
              <Icons.ArrowRight className="h-3.5 w-3.5" />
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Bar */}
      <section className="container">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 rounded-3xl border border-border/70 bg-card/30 p-8 text-center backdrop-blur-sm">
          <div>
            <div className="text-3xl md:text-4xl font-black font-mono text-primary">50,000+</div>
            <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wider font-semibold">Matches Played</div>
          </div>
          <div>
            <div className="text-3xl md:text-4xl font-black font-mono text-foreground">1,200+</div>
            <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wider font-semibold">Tournaments Hosted</div>
          </div>
          <div>
            <div className="text-3xl md:text-4xl font-black font-mono text-emerald-500">&lt; 0.8s</div>
            <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wider font-semibold">Door Scan Speed</div>
          </div>
          <div>
            <div className="text-3xl md:text-4xl font-black font-mono text-purple-500">99.9%</div>
            <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wider font-semibold">Platform Uptime</div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="container">
        <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/20 via-purple-600/10 to-card p-8 md:p-14 text-center shadow-2xl backdrop-blur-xl">
          <div className="max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-foreground">
              Ready to Host Your Next Championship?
            </h2>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
              Launch public or private esports brackets and event registrations in under two minutes. No credit card required.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Link
                href={`/${lang}/dashboard`}
                className={cn(
                  buttonVariants({ variant: "default", size: "lg" }),
                  "rounded-full px-8 text-base font-bold shadow-lg shadow-primary/30 gap-2",
                )}
              >
                <Icons.Trophy className="h-5 w-5" />
                Launch Tournament Now
              </Link>
              <Link
                href={`/${lang}/tournaments`}
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "rounded-full px-8 text-base font-semibold",
                )}
              >
                Browse Public Tournaments
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
