import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { getCurrentUser } from "@saasfly/auth";
import {
  db,
  EventStatus,
  FieldType,
  OrgRole,
  RegistrationStatus,
} from "@saasfly/db";

import { requireOrgRole } from "../permissions";
import { randomCheckInCode } from "../slug";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { getPlanEntitlements } from "../entitlements";

const registerSchema = z.object({
  slug: z.string().min(1).max(160),
  name: z.string().min(1).max(120),
  email: z.string().email().max(160),
  phone: z.string().max(40).optional(),
  answers: z
    .record(z.union([z.string(), z.number(), z.boolean(), z.null()]))
    .optional(),
});

const registrationIdSchema = z.object({
  registrationId: z.number().int().positive(),
});

const rosterSchema = z.object({
  organizationId: z.number().int().positive(),
  eventId: z.number().int().positive(),
  status: z.nativeEnum(RegistrationStatus).optional(),
  search: z.string().max(120).optional(),
  limit: z.number().int().positive().max(200).default(100),
  offset: z.number().int().min(0).default(0),
});

const statusUpdateSchema = z.object({
  organizationId: z.number().int().positive(),
  registrationId: z.number().int().positive(),
  status: z.nativeEnum(RegistrationStatus),
});

const noteUpdateSchema = z.object({
  organizationId: z.number().int().positive(),
  registrationId: z.number().int().positive(),
  note: z.string().max(1000).optional(),
});

const ACTIVE_STATUSES: RegistrationStatus[] = [
  RegistrationStatus.PENDING,
  RegistrationStatus.CONFIRMED,
];

interface FieldSpec {
  key: string;
  label: string;
  type: FieldType;
  options: string | null;
  required: boolean;
}

function serializeFieldOptions(options: string | null): string[] {
  if (!options) {
    return [];
  }
  return options
    .split(",")
    .map((option) => option.trim())
    .filter(Boolean);
}

function validateAnswers(
  fields: FieldSpec[],
  answers: Record<string, string | number | boolean | null> | undefined,
) {
  const payload = answers ?? {};
  const errors: string[] = [];

  for (const field of fields) {
    const value = payload[field.key];

    if (
      field.required &&
      (value === undefined || value === null || value === "")
    ) {
      errors.push(`${field.label} is required`);
      continue;
    }
    if (value === undefined || value === null || value === "") {
      continue;
    }

    if (field.type === FieldType.EMAIL && typeof value === "string") {
      if (!z.string().email().safeParse(value).success) {
        errors.push(`${field.label} must be a valid email`);
      }
    }
    if (field.type === FieldType.NUMBER && Number.isNaN(Number(value))) {
      errors.push(`${field.label} must be a number`);
    }
    if (field.type === FieldType.SELECT && typeof value === "string") {
      if (!serializeFieldOptions(field.options).includes(value)) {
        errors.push(`${field.label} has an invalid option`);
      }
    }
  }

  if (errors.length) {
    throw new TRPCError({ code: "BAD_REQUEST", message: errors.join(", ") });
  }
}

export const registrationRouter = createTRPCRouter({
  register: protectedProcedure
    .input(registerSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;
      const user = await getCurrentUser();

      if (!user) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You must be logged in to register",
        });
      }

      try {
        const event = await db
          .selectFrom("Event")
          .selectAll()
          .where("slug", "=", input.slug)
          .executeTakeFirst();

        if (
          !event ||
          event.status !== EventStatus.PUBLISHED ||
          !event.isPublic
        ) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Event not found or no longer accepting registrations",
          });
        }

        const already = await db
          .selectFrom("Registration")
          .select(["id", "status"])
          .where("eventId", "=", event.id)
          .where("authUserId", "=", userId)
          .executeTakeFirst();

        if (already) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "You are already registered for this event",
          });
        }

        const fields = await db
          .selectFrom("RegistrationField")
          .selectAll()
          .where("eventId", "=", event.id)
          .execute();

        validateAnswers(fields, input.answers);

        if (event.capacity !== null) {
          const { count } = await db
            .selectFrom("Registration")
            .select((eb) => eb.fn.count<number>("id").as("count"))
            .where("eventId", "=", event.id)
            .where("status", "in", ACTIVE_STATUSES)
            .executeTakeFirstOrThrow();

          if (Number(count) >= event.capacity) {
            throw new TRPCError({
              code: "PRECONDITION_FAILED",
              message: "This event is at full capacity",
            });
          }
        }

        const created = await db
          .insertInto("Registration")
          .values({
            eventId: event.id,
            organizationId: event.organizationId,
            authUserId: userId,
            name: input.name,
            email: input.email,
            phone: input.phone ?? null,
            status: event.requireApproval
              ? RegistrationStatus.PENDING
              : RegistrationStatus.CONFIRMED,
            answers: input.answers ?? null,
            checkInCode: randomCheckInCode(),
            checkInMethod: null,
          })
          .returning(["id", "status"])
          .executeTakeFirst();

        if (!created) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to complete the registration",
          });
        }

        return {
          id: created.id,
          status: created.status,
          success: true,
        };
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new TRPCError({ code: "BAD_REQUEST", cause: error });
        }
        throw error;
      }
    }),

  listMine: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.userId;

    return await db
      .selectFrom("Registration")
      .innerJoin("Event", "Event.id", "Registration.eventId")
      .innerJoin("Organization", "Organization.id", "Event.organizationId")
      .select([
        "Registration.id",
        "Registration.status",
        "Registration.checkInCode",
        "Registration.checkedInAt",
        "Registration.checkInMethod",
        "Registration.createdAt",
        "Event.id as eventId",
        "Event.name as eventName",
        "Event.slug as eventSlug",
        "Event.startsAt",
        "Event.endsAt",
        "Event.location",
        "Event.coverImage",
        "Event.status as eventStatus",
        "Organization.name as organizationName",
        "Organization.slug as organizationSlug",
      ])
      .where("Registration.authUserId", "=", userId)
      .orderBy("Event.startsAt", "desc")
      .execute();
  }),

  getMineById: protectedProcedure
    .input(registrationIdSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.userId;

      const registration = await db
        .selectFrom("Registration")
        .innerJoin("Event", "Event.id", "Registration.eventId")
        .innerJoin("Organization", "Organization.id", "Event.organizationId")
        .select([
          "Registration.id",
          "Registration.status",
          "Registration.checkInCode",
          "Registration.checkedInAt",
          "Registration.checkInMethod",
          "Registration.createdAt",
          "Registration.name",
          "Registration.email",
          "Event.id as eventId",
          "Event.name as eventName",
          "Event.startsAt",
          "Event.endsAt",
          "Event.location",
          "Event.status as eventStatus",
          "Organization.name as organizationName",
        ])
        .where("Registration.id", "=", input.registrationId)
        .where("Registration.authUserId", "=", userId)
        .executeTakeFirst();

      if (!registration) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Registration not found",
        });
      }

      return registration;
    }),

  cancelMine: protectedProcedure
    .input(registrationIdSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;

      const registration = await db
        .selectFrom("Registration")
        .selectAll()
        .where("id", "=", input.registrationId)
        .where("authUserId", "=", userId)
        .executeTakeFirst();

      if (!registration) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Registration not found",
        });
      }

      if (registration.status === RegistrationStatus.CANCELED) {
        return { success: true };
      }

      await db
        .updateTable("Registration")
        .set({ status: RegistrationStatus.CANCELED, updatedAt: new Date() })
        .where("id", "=", registration.id)
        .execute();

      return { success: true };
    }),

  roster: protectedProcedure
    .input(rosterSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.userId;
      await requireOrgRole(input.organizationId, userId, OrgRole.STAFF);

      let query = db
        .selectFrom("Registration")
        .selectAll()
        .where("organizationId", "=", input.organizationId)
        .where("eventId", "=", input.eventId);

      if (input.status) {
        query = query.where("status", "=", input.status);
      }
      if (input.search) {
        const term = `%${input.search}%`;
        query = query.where((eb) =>
          eb.or([
            eb("name", "ilike", term),
            eb("email", "ilike", term),
            eb("phone", "ilike", term),
          ]),
        );
      }

      const rows = await query
        .orderBy("createdAt", "desc")
        .limit(input.limit)
        .offset(input.offset)
        .execute();

      const { count: total } = await db
        .selectFrom("Registration")
        .select((eb) => eb.fn.count<number>("id").as("count"))
        .where("organizationId", "=", input.organizationId)
        .where("eventId", "=", input.eventId)
        .executeTakeFirstOrThrow();

      return {
        registrations: rows,
        total: Number(total),
      };
    }),

  updateStatus: protectedProcedure
    .input(statusUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;
      await requireOrgRole(input.organizationId, userId, OrgRole.ADMIN);

      const organization = await db
        .selectFrom("Organization")
        .select("plan")
        .where("id", "=", input.organizationId)
        .executeTakeFirst();

      if (!organization) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Organization not found",
        });
      }

      const touchesApprovalQueue =
        input.status === RegistrationStatus.CONFIRMED ||
        input.status === RegistrationStatus.REJECTED;

      if (
        touchesApprovalQueue &&
        !getPlanEntitlements(organization.plan).canApproveRegistrations
      ) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message:
            "Approving or rejecting registrations requires the Business plan",
        });
      }

      await db
        .updateTable("Registration")
        .set({ status: input.status, updatedAt: new Date() })
        .where("id", "=", input.registrationId)
        .where("organizationId", "=", input.organizationId)
        .execute();

      return { success: true };
    }),

  updateNote: protectedProcedure
    .input(noteUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;
      await requireOrgRole(input.organizationId, userId, OrgRole.STAFF);

      await db
        .updateTable("Registration")
        .set({ note: input.note ?? null, updatedAt: new Date() })
        .where("id", "=", input.registrationId)
        .where("organizationId", "=", input.organizationId)
        .execute();

      return { success: true };
    }),
});
