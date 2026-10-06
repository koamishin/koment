import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { getCurrentUser } from "@saasfly/auth";
import { db, OrgRole, SubscriptionPlan } from "@saasfly/db";

import { getPlanEntitlements, isWithinQuota } from "../entitlements";
import { requireOrgRole } from "../permissions";
import {
  normalizeJoinCode,
  randomJoinCode,
  randomSlugSuffix,
  slugify,
} from "../slug";
import { createTRPCRouter, protectedProcedure } from "../trpc";

const orgCreateSchema = z.object({
  name: z.string().min(2).max(64),
});

const orgJoinSchema = z.object({
  joinCode: z.string().min(4).max(32),
});

const orgMemberSchema = z.object({
  organizationId: z.number().int().positive(),
});

const orgMemberRoleSchema = orgMemberSchema.extend({
  memberId: z.number().int().positive(),
  role: z.nativeEnum(OrgRole),
});

async function resolvePlan(authUserId: string) {
  const customer = await db
    .selectFrom("Customer")
    .select("plan")
    .where("authUserId", "=", authUserId)
    .executeTakeFirst();

  return customer?.plan ?? SubscriptionPlan.FREE;
}

async function requireSelf() {
  const user = await getCurrentUser();
  if (!user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in",
    });
  }
  return user;
}

export const organizationRouter = createTRPCRouter({
  listMine: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.userId;

    return await db
      .selectFrom("OrgMember")
      .innerJoin("Organization", "Organization.id", "OrgMember.organizationId")
      .select([
        "Organization.id",
        "Organization.name",
        "Organization.slug",
        "Organization.plan",
        "Organization.joinCode",
        "OrgMember.role",
      ])
      .where("OrgMember.authUserId", "=", userId)
      .orderBy("OrgMember.createdAt", "asc")
      .execute();
  }),

  getById: protectedProcedure
    .input(orgMemberSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.userId;
      const viewer = await requireOrgRole(
        input.organizationId,
        userId,
        OrgRole.MEMBER,
      );

      const organization = await db
        .selectFrom("Organization")
        .selectAll()
        .where("id", "=", input.organizationId)
        .executeTakeFirst();

      if (!organization) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Organization not found",
        });
      }

      const entitlements = getPlanEntitlements(organization.plan);

      const [{ count: eventCount }, { count: memberCount }] = await Promise.all(
        [
          db
            .selectFrom("Event")
            .select((eb) => eb.fn.count<number>("id").as("count"))
            .where("organizationId", "=", organization.id)
            .executeTakeFirstOrThrow(),
          db
            .selectFrom("OrgMember")
            .select((eb) => eb.fn.count<number>("id").as("count"))
            .where("organizationId", "=", organization.id)
            .executeTakeFirstOrThrow(),
        ],
      );

      return {
        ...organization,
        viewerRole: viewer.role,
        entitlements,
        usage: {
          events: Number(eventCount ?? 0),
          members: Number(memberCount ?? 0),
        },
      };
    }),

  create: protectedProcedure
    .input(orgCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;
      const user = await requireSelf();

      try {
        const plan = await resolvePlan(userId);
        const created = await db
          .insertInto("Organization")
          .values({
            name: input.name,
            slug: `${slugify(input.name)}-${randomSlugSuffix()}`,
            joinCode: randomJoinCode(),
            authUserId: userId,
            plan,
          })
          .returning("id")
          .executeTakeFirst();

        if (!created) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create the organization",
          });
        }

        await db
          .insertInto("OrgMember")
          .values({
            organizationId: created.id,
            authUserId: userId,
            email: user.email ?? "",
            name: user.name ?? null,
            role: OrgRole.OWNER,
          })
          .execute();

        return { id: created.id, success: true };
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new TRPCError({ code: "BAD_REQUEST", cause: error });
        }
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", cause: error });
      }
    }),

  join: protectedProcedure
    .input(orgJoinSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;
      const user = await requireSelf();

      try {
        const organization = await db
          .selectFrom("Organization")
          .selectAll()
          .where("joinCode", "=", normalizeJoinCode(input.joinCode))
          .executeTakeFirst();

        if (!organization) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "No organization matches that invite code",
          });
        }

        const existing = await db
          .selectFrom("OrgMember")
          .select("id")
          .where("organizationId", "=", organization.id)
          .where("authUserId", "=", userId)
          .executeTakeFirst();

        if (existing) {
          return { id: organization.id, success: true };
        }

        const entitlements = getPlanEntitlements(organization.plan);
        const memberCount = await db
          .selectFrom("OrgMember")
          .select((eb) => eb.fn.count<number>("id").as("count"))
          .where("organizationId", "=", organization.id)
          .executeTakeFirstOrThrow();

        if (
          !isWithinQuota(Number(memberCount.count), entitlements.maxMembers)
        ) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "This organization has reached its member limit",
          });
        }

        await db
          .insertInto("OrgMember")
          .values({
            organizationId: organization.id,
            authUserId: userId,
            email: user.email ?? "",
            name: user.name ?? null,
            role: OrgRole.MEMBER,
          })
          .execute();

        return { id: organization.id, success: true };
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new TRPCError({ code: "BAD_REQUEST", cause: error });
        }
        throw error;
      }
    }),

  listMembers: protectedProcedure
    .input(orgMemberSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.userId;
      await requireOrgRole(input.organizationId, userId, OrgRole.MEMBER);

      return await db
        .selectFrom("OrgMember")
        .selectAll()
        .where("organizationId", "=", input.organizationId)
        .orderBy("createdAt", "asc")
        .execute();
    }),

  updateMemberRole: protectedProcedure
    .input(orgMemberRoleSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;
      const actor = await requireOrgRole(
        input.organizationId,
        userId,
        OrgRole.ADMIN,
      );

      if (input.role === OrgRole.OWNER) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Ownership cannot be reassigned here",
        });
      }

      if (actor.role === OrgRole.ADMIN && input.role === OrgRole.ADMIN) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only an owner can promote another admin",
        });
      }

      const target = await db
        .selectFrom("OrgMember")
        .selectAll()
        .where("id", "=", input.memberId)
        .where("organizationId", "=", input.organizationId)
        .executeTakeFirst();

      if (!target) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Member not found" });
      }

      if (target.role === OrgRole.OWNER) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "The owner's role cannot be changed",
        });
      }

      await db
        .updateTable("OrgMember")
        .set({ role: input.role, updatedAt: new Date() })
        .where("id", "=", target.id)
        .execute();

      return { success: true };
    }),

  removeMember: protectedProcedure
    .input(orgMemberRoleSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;
      const actor = await requireOrgRole(
        input.organizationId,
        userId,
        OrgRole.ADMIN,
      );

      const target = await db
        .selectFrom("OrgMember")
        .selectAll()
        .where("id", "=", input.memberId)
        .where("organizationId", "=", input.organizationId)
        .executeTakeFirst();

      if (!target) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Member not found" });
      }

      if (target.role === OrgRole.OWNER) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "The owner cannot be removed",
        });
      }

      if (actor.role === OrgRole.ADMIN && target.role === OrgRole.ADMIN) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only an owner can remove another admin",
        });
      }

      await db.deleteFrom("OrgMember").where("id", "=", target.id).execute();

      return { success: true };
    }),
});
