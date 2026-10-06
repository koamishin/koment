"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@saasfly/ui/dialog";
import { Badge } from "@saasfly/ui/badge";
import { TeamRegisterForm } from "./team-register-form";

interface TeamRegisterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tournamentId: number;
  tournamentName: string;
  tournamentSlug?: string;
  gameFormat?: string;
  onSuccess?: () => void;
  lang?: string;
}

export function TeamRegisterDialog({
  open,
  onOpenChange,
  tournamentId,
  tournamentName,
  tournamentSlug = "",
  gameFormat = "5v5",
  onSuccess,
  lang = "en",
}: TeamRegisterDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[92vh] overflow-y-auto p-6">
        <DialogHeader className="text-left space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-[10px] text-primary border-primary/30">
              Format: {gameFormat}
            </Badge>
            <Badge variant="secondary" className="text-[10px]">
              Direct Student Entry
            </Badge>
          </div>
          <DialogTitle className="text-2xl font-black tracking-tight">
            Register for {tournamentName}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Only the captain needs to submit. Teammate tags can be updated anytime before bracket generation.
          </DialogDescription>
        </DialogHeader>

        <div className="pt-2">
          <TeamRegisterForm
            tournamentId={tournamentId}
            tournamentName={tournamentName}
            tournamentSlug={tournamentSlug}
            gameFormat={gameFormat}
            onSuccess={() => {
              onSuccess?.();
              onOpenChange(false);
            }}
            onCancel={() => onOpenChange(false)}
            standalone={false}
            lang={lang}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
