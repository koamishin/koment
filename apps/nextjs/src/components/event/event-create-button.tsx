"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button, type ButtonProps } from "@saasfly/ui/button";
import * as Icons from "@saasfly/ui/icons";
import { toast } from "@saasfly/ui/use-toast";

import { trpc } from "~/trpc/client";

import type { EventDict } from "~/components/event/dict";

interface EventCreateButtonProps extends ButtonProps {
  organizationId: number;
  dict: EventDict;
  params: { lang: string };
  atEventLimit?: boolean;
}

export function EventCreateButton({
  organizationId,
  dict,
  params,
  atEventLimit,
  variant,
  className,
  ...props
}: EventCreateButtonProps) {
  const router = useRouter();
  const [isCreating, setIsCreating] = React.useState<boolean>(false);

  async function onCreate() {
    if (atEventLimit) {
      return toast({
        title: "Plan limit reached.",
        description: dict.upgrade_hint,
        variant: "destructive",
      });
    }

    const startsAt = new Date();
    startsAt.setDate(startsAt.getDate() + 14);

    setIsCreating(true);

    try {
      const response = await trpc.event.create.mutate({
        organizationId,
        name: dict.event_name_placeholder,
        startsAt,
        status: "DRAFT",
        isPublic: true,
        requireApproval: false,
      });

      router.push(
        `/${params.lang}/dashboard/organizations/${organizationId}/events/${response.id}/edit`,
      );
      router.refresh();
      toast({ description: dict.event_created });
    } catch (error) {
      toast({
        title: "Something went wrong.",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <Button
      onClick={onCreate}
      variant={variant}
      className={className}
      disabled={isCreating}
      {...props}
    >
      {isCreating ? (
        <Icons.Spinner className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Icons.Add className="mr-2 h-4 w-4" />
      )}
      {dict.new_event}
    </Button>
  );
}
