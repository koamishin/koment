"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@saasfly/ui/button";
import * as Icons from "@saasfly/ui/icons";
import { toast } from "@saasfly/ui/use-toast";

import { trpc } from "~/trpc/client";

import type { EventDict } from "~/components/event/dict";

interface EventStatusToggleProps {
  organizationId: number;
  event: {
    id: number;
    name: string;
    startsAt: Date | string;
    status: "DRAFT" | "PUBLISHED" | "CANCELED" | "COMPLETED";
  };
  dict: EventDict;
}

export function EventStatusToggle({
  organizationId,
  event,
  dict,
}: EventStatusToggleProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = React.useState<boolean>(false);

  const nextStatus = event.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";

  async function onToggle() {
    setIsSaving(true);

    try {
      const response = await trpc.event.update.mutate({
        organizationId,
        id: event.id,
        name: event.name,
        startsAt: new Date(event.startsAt),
        status: nextStatus,
      });

      if (!response?.success) {
        return toast({
          title: "Something went wrong.",
          description: "Your event was not saved. Please try again.",
          variant: "destructive",
        });
      }

      router.refresh();
      toast({
        description:
          nextStatus === "PUBLISHED"
            ? dict.status_published
            : dict.status_draft,
      });
    } catch (error) {
      toast({
        title: "Something went wrong.",
        description:
          error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Button
      size="sm"
      variant={event.status === "PUBLISHED" ? "outline" : "default"}
      disabled={isSaving}
      onClick={onToggle}
    >
      {isSaving ? (
        <Icons.Spinner className="mr-2 h-4 w-4 animate-spin" />
      ) : event.status === "PUBLISHED" ? (
        <Icons.Post className="mr-2 h-4 w-4" />
      ) : (
        <Icons.Rocket className="mr-2 h-4 w-4" />
      )}
      {event.status === "PUBLISHED" ? dict.unpublish : dict.publish}
    </Button>
  );
}
