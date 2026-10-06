import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { CheckInMethod, db, OrgRole, RegistrationStatus } from "@saasfly/db";

import { getPlanEntitlements } from "../entitlements";
import { requireOrgRole } from "../permissions";
import { normalizeCheckInCode } from "../slug";
import { createTRPCRouter, protectedProcedure } from "../trpc";

const verifySchema = z.object({
  organizationId: z.number().int().positive(),
  eventId: z.number().int().positive(),
  code: z.string().min(4).max(64),
});

const manualSchema = z.object({
  organizationId: z.number().int().positive(),
  eventId: z.number().int().positive(),
  registrationId: z.number().int().positive(),
  present: z.boolean(),
});

async function requireQrEntitlement(organizationId: number) {
  const organization = await db
    .selectFrom("Organization")
    .select("plan")
    .where("id", "=", organizationId)
    .executeTakeFirst();

  if (!organization) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Organization not found",
    });
  }

  if (!getPlanEntitlements(organization.plan).canQrCheckIn) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message:
        "QR check-in requires the Pro plan. Use manual check-in instead.",
    });
  }

  return organization;
}

export const checkInRouter = createTRPCRouter({
  verifyCode: protectedProcedure
    .input(verifySchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;
      await requireOrgRole(input.organizationId, userId, OrgRole.STAFF);
      await requireQrEntitlement(input.organizationId);

      const registration = await db
        .selectFrom("Registration")
        .selectAll()
        .where("eventId", "=", input.eventId)
        .where("organizationId", "=", input.organizationId)
        .where("checkInCode", "=", normalizeCheckInCode(input.code))
        .executeTakeFirst();

      if (!registration) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No pass matches that code for this event",
        });
      }

      if (registration.status === RegistrationStatus.CANCELED) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: `${registration.name} cancelled their registration`,
        });
      }

      if (registration.status === RegistrationStatus.REJECTED) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: `${registration.name}'s registration was rejected`,
        });
      }

      if (registration.status === RegistrationStatus.PENDING) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: `${registration.name}'s registration is still awaiting approval`,
        });
      }

      if (registration.checkedInAt) {
        return {
          registration,
          alreadyCheckedIn: true,
          success: true,
        };
      }

      const checkedInAt = new Date();

      await db
        .updateTable("Registration")
        .set({
          checkedInAt,
          checkInMethod: CheckInMethod.QR,
          checkedInBy: userId,
          updatedAt: checkedInAt,
        })
        .where("id", "=", registration.id)
        .execute();

      return {
        registration: {
          ...registration,
          checkedInAt,
          checkInMethod: CheckInMethod.MANUAL,
          checkedInBy: userId,
        },
        success: true,
      };
    }),

  verifyTournamentCode: protectedProcedure
    .input(
      z.object({
        organizationId: z.number().int().positive(),
        tournamentId: z.number().int().positive(),
        code: z.string().min(4).max(64),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;
      await requireOrgRole(input.organizationId, userId, OrgRole.STAFF);

      const team = await db
        .selectFrom("TournamentTeam")
        .selectAll()
        .where("tournamentId", "=", input.tournamentId)
        .where("checkInCode", "=", normalizeCheckInCode(input.code))
        .executeTakeFirst();

      if (!team) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No team matches that check-in code for this tournament",
        });
      }

      const isCheckedIn = team.status === "CHECKED_IN";
      if (isCheckedIn) {
        return {
          team,
          alreadyCheckedIn: true,
          success: true,
        };
      }

      const updated = await db
        .updateTable("TournamentTeam")
        .set({
          status: "CHECKED_IN",
          updatedAt: new Date(),
        })
        .where("id", "=", team.id)
        .returningAll()
        .executeTakeFirstOrThrow();

      return {
        team: updated,
        alreadyCheckedIn: false,
        success: true,
      };
    }),

  setManual: protectedProcedure
    .input(manualSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;
      await requireOrgRole(input.organizationId, userId, OrgRole.STAFF);

      const registration = await db
        .selectFrom("Registration")
        .selectAll()
        .where("id", "=", input.registrationId)
        .where("eventId", "=", input.eventId)
        .where("organizationId", "=", input.organizationId)
        .executeTakeFirst();

      if (!registration) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Registration not found",
        });
      }

      if (registration.status === RegistrationStatus.CANCELED) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "This registration was cancelled",
        });
      }

      if (!input.present) {
        await db
          .updateTable("Registration")
          .set({
            checkedInAt: null,
            checkInMethod: null,
            checkedInBy: null,
            updatedAt: new Date(),
          })
          .where("id", "=", registration.id)
          .execute();

        return { success: true, present: false };
      }

      const checkedInAt = registration.checkedInAt ?? new Date();

      await db
        .updateTable("Registration")
        .set({
          checkedInAt,
          checkInMethod: CheckInMethod.MANUAL,
          checkedInBy: userId,
          updatedAt: new Date(),
        })
        .where("id", "=", registration.id)
        .execute();

      return { success: true, present: true, checkedInAt };
    }),

  stats: protectedProcedure
    .input(
      z.object({
        organizationId: z.number().int().positive(),
        eventId: z.number().int().positive(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.userId;
      await requireOrgRole(input.organizationId, userId, OrgRole.STAFF);

      const [confirmed, pending, present] = await Promise.all([
        db
          .selectFrom("Registration")
          .select((eb) => eb.fn.count<number>("id").as("count"))
          .where("eventId", "=", input.eventId)
          .where("status", "=", RegistrationStatus.CONFIRMED)
          .executeTakeFirstOrThrow(),
        db
          .selectFrom("Registration")
          .select((eb) => eb.fn.count<number>("id").as("count"))
          .where("eventId", "=", input.eventId)
          .where("status", "=", RegistrationStatus.PENDING)
          .executeTakeFirstOrThrow(),
        db
          .selectFrom("Registration")
          .select((eb) => eb.fn.count<number>("id").as("count"))
          .where("eventId", "=", input.eventId)
          .where("checkedInAt", "is not", null)
          .executeTakeFirstOrThrow(),
      ]);

      return {
        confirmed: Number(confirmed.count),
        pending: Number(pending.count),
        present: Number(present.count),
      };
    }),

  recentActivity: protectedProcedure
    .input(
      z.object({
        organizationId: z.number().int().positive(),
        eventId: z.number().int().positive(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.userId;
      await requireOrgRole(input.organizationId, userId, OrgRole.STAFF);

      return await db
        .selectFrom("Registration")
        .select(["id", "name", "checkedInAt", "checkInMethod", "checkedInBy"])
        .where("eventId", "=", input.eventId)
        .where("organizationId", "=", input.organizationId)
        .where("checkedInAt", "is not", null)
        .orderBy("checkedInAt", "desc")
        .limit(20)
        .execute();
    }),
});
