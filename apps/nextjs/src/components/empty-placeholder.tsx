import * as React from "react";

import { cn } from "@saasfly/ui";
import * as Icons from "@saasfly/ui/icons";

type EmptyPlaceholderProps = React.HTMLAttributes<HTMLDivElement>;

export function EmptyPlaceholder({
  className,
  children,
  ...props
}: EmptyPlaceholderProps) {
  return (
    <div
      className={cn(
        "relative flex min-h-[400px] flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border/70 bg-card/30 p-10 text-center",
        className,
      )}
      {...props}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-40 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl"
      />
      <div className="relative mx-auto flex max-w-md flex-col items-center justify-center text-center">
        {children}
      </div>
    </div>
  );
}

interface EmptyPlaceholderIconProps
  extends Partial<React.SVGProps<SVGSVGElement>> {
  name: keyof typeof Icons;
}

EmptyPlaceholder.Icon = function EmptyPlaceHolderIcon({
  name,
  className, // ...props
}: EmptyPlaceholderIconProps) {
  const Icon = Icons[name];

  if (!Icon) {
    return null;
  }

  return (
    <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border/70 bg-gradient-to-br from-primary/20 to-primary/5 shadow-inner">
      <Icon className={cn("h-7 w-7 text-primary", className)} />
    </div>
  );
};

type EmptyPlacholderTitleProps = React.HTMLAttributes<HTMLHeadingElement>;

EmptyPlaceholder.Title = function EmptyPlaceholderTitle({
  className,
  ...props
}: EmptyPlacholderTitleProps) {
  return (
    // eslint-disable-next-line jsx-a11y/heading-has-content
    <h2
      className={cn("mt-6 font-heading text-xl font-semibold", className)}
      {...props}
    />
  );
};

type EmptyPlacholderDescriptionProps =
  React.HTMLAttributes<HTMLParagraphElement>;

EmptyPlaceholder.Description = function EmptyPlaceholderDescription({
  className,
  ...props
}: EmptyPlacholderDescriptionProps) {
  return (
    <p
      className={cn(
        "mb-8 mt-2 text-center text-sm font-normal leading-relaxed text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
};
