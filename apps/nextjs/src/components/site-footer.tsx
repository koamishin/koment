import * as React from "react";
import { cn } from "@saasfly/ui";
import { ModeToggle } from "~/components/mode-toggle";
import * as Icons from "@saasfly/ui/icons";

function getCopyrightText(
  dict: Record<string, string | Record<string, string>>,
) {
  const currentYear = new Date().getFullYear();
  const copyrightTemplate = String(dict.copyright);
  return copyrightTemplate?.replace("${currentYear}", String(currentYear));
}

export function SiteFooter({
  className,
  dict,
}: {
  className?: string;
  params: {
    lang: string;
  };

  dict: Record<string, string | Record<string, string>>;
}) {
  return (
    <footer className={cn(className)}>
      <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-3 md:px-0">
          <div className="flex items-center gap-2">
            <Icons.Trophy className="h-5 w-5 text-amber-500" />
            <span className="font-black text-lg tracking-tight">Koment</span>
          </div>
          <span className="hidden text-muted-foreground md:inline">•</span>
          <p className="text-center text-sm text-muted-foreground md:text-left">
            {getCopyrightText(dict)}
          </p>
        </div>
        <ModeToggle />
      </div>
    </footer>
  );
}
