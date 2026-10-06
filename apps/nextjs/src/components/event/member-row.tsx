"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@saasfly/ui/alert-dialog";
import * as Icons from "@saasfly/ui/icons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@saasfly/ui/select";
import { toast } from "@saasfly/ui/use-toast";

import { trpc } from "~/trpc/client";

import type { EventDict } from "~/components/event/dict";

type OrgRoleValue = "OWNER" | "ADMIN" | "STAFF" | "MEMBER";

interface MemberRowProps {
  organizationId: number;
  member: {
    id: number;
    name: string | null;
    email: string;
    role: OrgRoleValue;
  };
  viewerRole: OrgRoleValue;
  dict: EventDict;
}

const ASSIGNABLE_ROLES: Exclude<OrgRoleValue, "OWNER">[] = [
  "ADMIN",
  "STAFF",
  "MEMBER",
];

export function MemberRow({
  organizationId,
  member,
  viewerRole,
  dict,
}: MemberRowProps) {
  const router = useRouter();
  const [showRemoveAlert, setShowRemoveAlert] = React.useState<boolean>(false);
  const [isSaving, setIsSaving] = React.useState<boolean>(false);

  const canManage =
    member.role !== "OWNER" &&
    (viewerRole === "OWNER" ||
      (viewerRole === "ADMIN" && member.role !== "ADMIN"));

  async function onRoleChange(role: string) {
    setIsSaving(true);

    try {
      const response = await trpc.organization.updateMemberRole.mutate({
        organizationId,
        memberId: member.id,
        role: role as Exclude<OrgRoleValue, "OWNER">,
      });

      if (!response?.success) {
        return toast({
          title: "Something went wrong.",
          description: "The role was not changed. Please try again.",
          variant: "destructive",
        });
      }

      router.refresh();
      toast({ description: "Member role updated." });
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

  async function onRemove() {
    setIsSaving(true);

    try {
      const response = await trpc.organization.removeMember.mutate({
        organizationId,
        memberId: member.id,
        role: member.role,
      });

      if (!response?.success) {
        return toast({
          title: "Something went wrong.",
          description: "The member was not removed. Please try again.",
          variant: "destructive",
        });
      }

      setShowRemoveAlert(false);
      router.refresh();
      toast({ description: "Member removed." });
    } catch (error) {
      setShowRemoveAlert(false);
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
    <>
      <tr className="border-b transition-colors hover:bg-muted/50">
        <td className="p-4 align-middle">
          <div className="flex flex-col">
            <span className="font-medium">{member.name ?? "—"}</span>
            <span className="text-xs text-muted-foreground">
              {member.email}
            </span>
          </div>
        </td>
        <td className="p-4 align-middle">
          {!canManage ? (
            <span className="text-sm text-muted-foreground">
              {
                (dict as Record<string, string>)[
                  `role_${member.role.toLowerCase()}`
                ]
              }
            </span>
          ) : (
            <Select
              value={member.role}
              disabled={isSaving}
              onValueChange={onRoleChange}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ASSIGNABLE_ROLES.map((role) => (
                  <SelectItem key={role} value={role}>
                    {
                      (dict as Record<string, string>)[
                        `role_${role.toLowerCase()}`
                      ]
                    }
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </td>
        <td className="p-4 text-right align-middle">
          {canManage ? (
            <button
              type="button"
              onClick={() => setShowRemoveAlert(true)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border transition-colors hover:bg-muted"
            >
              <Icons.Trash className="h-4 w-4 text-destructive" />
              <span className="sr-only">Remove</span>
            </button>
          ) : null}
        </td>
      </tr>

      <AlertDialog open={showRemoveAlert} onOpenChange={setShowRemoveAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Remove {member.name ?? member.email} from this organization?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(clickEvent) => {
                clickEvent.preventDefault();
                void onRemove();
              }}
              className="bg-red-600 focus:ring-red-600"
            >
              <Icons.Trash className="mr-2 h-4 w-4" />
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
