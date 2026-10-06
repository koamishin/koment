import { TRPCError } from "@trpc/server";

import { db, OrgRole } from "@saasfly/db";

export const ORG_ROLE_RANK: Record<OrgRole, number> = {
  [OrgRole.OWNER]: 3,
  [OrgRole.ADMIN]: 2,
  [OrgRole.STAFF]: 1,
  [OrgRole.MEMBER]: 0,
};

export function hasOrgRole(role: OrgRole, minimum: OrgRole): boolean {
  return ORG_ROLE_RANK[role] >= ORG_ROLE_RANK[minimum];
}

export async function requireOrgMember(
  organizationId: number,
  authUserId: string,
) {
  let member = await db
    .selectFrom("OrgMember")
    .selectAll()
    .where("organizationId", "=", organizationId)
    .where("authUserId", "=", authUserId)
    .executeTakeFirst();

  if (!member) {
    const org = await db
      .selectFrom("Organization")
      .select(["id", "authUserId"])
      .where("id", "=", organizationId)
      .where("authUserId", "=", authUserId)
      .executeTakeFirst();

    if (org) {
      member = await db
        .insertInto("OrgMember")
        .values({
          organizationId,
          authUserId,
          email: "",
          name: "Owner",
          role: OrgRole.OWNER,
        })
        .returningAll()
        .executeTakeFirst();
    }
  }

  if (!member) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You don't have access to this organization",
    });
  }

  return member;
}

export async function requireOrgRole(
  organizationId: number,
  authUserId: string,
  minimum: OrgRole,
) {
  const member = await requireOrgMember(organizationId, authUserId);

  if (!hasOrgRole(member.role, minimum)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You don't have permission to perform this action",
    });
  }

  return member;
}
