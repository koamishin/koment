"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@saasfly/ui/button";
import * as Icons from "@saasfly/ui/icons";
import { cn } from "@saasfly/ui";
import { TournamentFormDialog } from "./tournament-form-dialog";

interface TournamentCreateButtonProps {
  organizationId?: number;
  organizations?: { id: number; name: string }[];
  className?: string;
  variant?: "default" | "outline" | "secondary";
  label?: string;
  autoOpen?: boolean;
  onSaved?: (tournamentId: number) => void;
  lang?: string;
}

export function TournamentCreateButton({
  organizationId,
  organizations,
  className,
  variant = "default",
  label = "New Tournament",
  autoOpen = false,
  onSaved,
  lang,
}: TournamentCreateButtonProps) {
  const [open, setOpen] = React.useState(autoOpen);
  const router = useRouter();
  const params = useParams();

  const handleSaved = (tournamentId: number) => {
    if (onSaved) {
      onSaved(tournamentId);
      return;
    }
    const targetOrgId = organizationId ?? organizations?.[0]?.id;
    if (targetOrgId) {
      const currentLang = (params?.lang as string) ?? lang ?? "en";
      router.push(
        `/${currentLang}/dashboard/organizations/${targetOrgId}/tournaments/${tournamentId}`,
      );
      router.refresh();
    }
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant={variant}
        className={cn("gap-1.5 font-semibold text-xs shadow-sm", className)}
      >
        <Icons.Add className="h-4 w-4" />
        {label}
      </Button>
      <TournamentFormDialog
        open={open}
        onOpenChange={setOpen}
        organizationId={organizationId}
        organizations={organizations}
        onSaved={handleSaved}
        lang={lang}
      />
    </>
  );
}
