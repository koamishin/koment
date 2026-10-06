import { TRPCError } from "@trpc/server";
import { z } from "zod";

import {
  db,
  EventStatus,
  FieldType,
  OrgRole,
  RegistrationStatus,
} from "@saasfly/db";

import { getPlanEntitlements, isWithinQuota } from "../entitlements";
import { requireOrgRole } from "../permissions";
import { randomSlugSuffix, slugify } from "../slug";
import { createTRPCRouter, procedure, protectedProcedure } from "../trpc";

const eventUpsertSchema = z.object({
  organizationId: z.number().int().positive(),
  id: z.number().int().positive().optional(),
  name: z.string().min(2).max(120),
  description: z.string().max(4000).optional(),
  location: z.string().max(160).optional(),
  coverImage: z.string().url().optional().or(z.literal("")),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date().optional(),
  capacity: z.number().int().positive().max(100000).optional(),
  requireApproval: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  status: z.nativeEnum(EventStatus).optional(),
});

const eventIdSchema = z.object({
  organizationId: z.number().int().positive(),
  eventId: z.number().int().positive(),
});

const eventFieldSchema = z.object({
  eventId: z.number().int().positive(),
  id: z.number().int().positive().optional(),
  key: z
    .string()
    .min(1)
    .max(48)
    .regex(
      /^[a-z0-9_]+$/,
      "key must be lowercase alphanumeric with underscores",
    ),
  label: z.string().min(1).max(80),
  type: z.nativeEnum(FieldType),
  options: z.array(z.string().min(1).max(80)).max(30).optional(),
  required: z.boolean().optional(),
});

const fieldOrderSchema = z.object({
  eventId: z.number().int().positive(),
  fieldIds: z.array(z.number().int().positive()),
});

async function requireEvent(organizationId: number, eventId: number) {
  const event = await db
    .selectFrom("Event")
    .selectAll()
    .where("id", "=", eventId)
    .where("organizationId", "=", organizationId)
    .executeTakeFirst();

  if (!event) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
  }

  return event;
}

async function requireOrganizationPlan(organizationId: number) {
  const organization = await db
    .selectFrom("Organization")
    .selectAll()
    .where("id", "=", organizationId)
    .executeTakeFirst();

  if (!organization) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Organization not found",
    });
  }

  return organization;
}

export const eventRouter = createTRPCRouter({
  listByOrganization: protectedProcedure
    .input(z.object({ organizationId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.userId;
      await requireOrgRole(input.organizationId, userId, OrgRole.STAFF);

      return await db
        .selectFrom("Event")
        .innerJoin("Organization", "Organization.id", "Event.organizationId")
        .select([
          "Event.id",
          "Event.name",
          "Event.slug",
          "Event.location",
          "Event.startsAt",
          "Event.endsAt",
          "Event.capacity",
          "Event.status",
          "Event.requireApproval",
          "Event.isPublic",
          "Organization.name as organizationName",
        ])
        .where("Event.organizationId", "=", input.organizationId)
        .orderBy("Event.startsAt", "desc")
        .execute();
    }),

  // Public discovery: only PUBLISHED + isPublic rows are ever returned, so
  // this needs no session. Anything tenant-specific stays behind protectedProcedure.
  listPublic: procedure.query(async () => {
    const events = await db
      .selectFrom("Event")
      .innerJoin("Organization", "Organization.id", "Event.organizationId")
      .select([
        "Event.id",
        "Event.name",
        "Event.slug",
        "Event.description",
        "Event.location",
        "Event.coverImage",
        "Event.startsAt",
        "Event.endsAt",
        "Event.capacity",
        "Event.requireApproval",
        "Organization.name as organizationName",
        "Organization.slug as organizationSlug",
      ])
      .where("Event.status", "=", EventStatus.PUBLISHED)
      .where("Event.isPublic", "=", true)
      .orderBy("Event.startsAt", "asc")
      .execute();

    if (events.length === 0) {
      return [];
    }

    const seatRows = await db
      .selectFrom("Registration")
      .select(["eventId", (eb) => eb.fn.count<number>("id").as("seats")])
      .where(
        "eventId",
        "in",
        events.map((event) => event.id),
      )
      .where("status", "in", [
        RegistrationStatus.PENDING,
        RegistrationStatus.CONFIRMED,
      ])
      .groupBy("eventId")
      .execute();

    const seatsByEvent = new Map(
      seatRows.map((row) => [row.eventId, Number(row.seats)]),
    );

    return events.map((event) => ({
      ...event,
      confirmedCount: seatsByEvent.get(event.id) ?? 0,
    }));
  }),

  getBySlug: procedure
    .input(z.object({ slug: z.string().min(1).max(160) }))
    .query(async ({ input }) => {
      const event = await db
        .selectFrom("Event")
        .innerJoin("Organization", "Organization.id", "Event.organizationId")
        .select([
          "Event.id",
          "Event.organizationId",
          "Event.name",
          "Event.slug",
          "Event.description",
          "Event.location",
          "Event.coverImage",
          "Event.startsAt",
          "Event.endsAt",
          "Event.capacity",
          "Event.status",
          "Event.requireApproval",
          "Event.isPublic",
          "Organization.name as organizationName",
          "Organization.slug as organizationSlug",
        ])
        .where("Event.slug", "=", input.slug)
        .where("Event.status", "=", EventStatus.PUBLISHED)
        .where("Event.isPublic", "=", true)
        .executeTakeFirst();

      if (!event) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
      }

      const fields = await db
        .selectFrom("RegistrationField")
        .selectAll()
        .where("eventId", "=", event.id)
        .orderBy("position", "asc")
        .execute();

      const { count: confirmedCount } = await db
        .selectFrom("Registration")
        .select((eb) => eb.fn.count<number>("id").as("count"))
        .where("eventId", "=", event.id)
        .where("status", "in", ["CONFIRMED", "PENDING"])
        .executeTakeFirstOrThrow();

      return {
        ...event,
        fields,
        confirmedCount: Number(confirmedCount ?? 0),
      };
    }),

  getById: protectedProcedure
    .input(eventIdSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.userId;
      const member = await requireOrgRole(
        input.organizationId,
        userId,
        OrgRole.STAFF,
      );

      const event = await requireEvent(input.organizationId, input.eventId);

      const [confirmed, pending, checkedIn] = await Promise.all([
        db
          .selectFrom("Registration")
          .select((eb) => eb.fn.count<number>("id").as("count"))
          .where("eventId", "=", event.id)
          .where("status", "=", "CONFIRMED")
          .executeTakeFirstOrThrow(),
        db
          .selectFrom("Registration")
          .select((eb) => eb.fn.count<number>("id").as("count"))
          .where("eventId", "=", event.id)
          .where("status", "=", "PENDING")
          .executeTakeFirstOrThrow(),
        db
          .selectFrom("Registration")
          .select((eb) => eb.fn.count<number>("id").as("count"))
          .where("eventId", "=", event.id)
          .where("checkedInAt", "is not", null)
          .executeTakeFirstOrThrow(),
      ]);

      return {
        ...event,
        viewerRole: member.role,
        stats: {
          confirmed: Number(confirmed.count),
          pending: Number(pending.count),
          checkedIn: Number(checkedIn.count),
        },
      };
    }),

  create: protectedProcedure
    .input(eventUpsertSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;
      await requireOrgRole(input.organizationId, userId, OrgRole.ADMIN);

      try {
        const organization = await requireOrganizationPlan(
          input.organizationId,
        );
        const entitlements = getPlanEntitlements(organization.plan);

        const existing = await db
          .selectFrom("Event")
          .select((eb) => eb.fn.count<number>("id").as("count"))
          .where("organizationId", "=", input.organizationId)
          .executeTakeFirstOrThrow();

        if (!isWithinQuota(Number(existing.count), entitlements.maxEvents)) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: `Your ${organization.plan} plan allows ${entitlements.maxEvents} event(s). Upgrade to add more.`,
          });
        }

        if (input.requireApproval && !entitlements.canApproveRegistrations) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: "Approval workflows require the Business plan",
          });
        }

        const created = await db
          .insertInto("Event")
          .values({
            organizationId: input.organizationId,
            authUserId: userId,
            name: input.name,
            slug: `${slugify(input.name)}-${randomSlugSuffix()}`,
            description: input.description ?? null,
            location: input.location ?? null,
            coverImage: input.coverImage ?? null,
            startsAt: input.startsAt,
            endsAt: input.endsAt ?? null,
            capacity: input.capacity ?? null,
            requireApproval: input.requireApproval ?? false,
            isPublic: input.isPublic ?? true,
            status: input.status ?? EventStatus.DRAFT,
          })
          .returning(["id", "slug"])
          .executeTakeFirst();

        if (!created) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to create the event",
          });
        }

        return { id: created.id, slug: created.slug, success: true };
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new TRPCError({ code: "BAD_REQUEST", cause: error });
        }
        throw error;
      }
    }),

  update: protectedProcedure
    .input(eventUpsertSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;
      if (!input.id) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "id is required" });
      }

      try {
        await requireOrgRole(input.organizationId, userId, OrgRole.ADMIN);
        const event = await requireEvent(input.organizationId, input.id);

        if (input.requireApproval && !event.requireApproval) {
          const organization = await requireOrganizationPlan(
            input.organizationId,
          );
          if (!getPlanEntitlements(organization.plan).canApproveRegistrations) {
            throw new TRPCError({
              code: "PRECONDITION_FAILED",
              message: "Approval workflows require the Business plan",
            });
          }
        }

        await db
          .updateTable("Event")
          .set({
            name: input.name,
            description: input.description ?? null,
            location: input.location ?? null,
            coverImage: input.coverImage ?? null,
            startsAt: input.startsAt,
            endsAt: input.endsAt ?? null,
            capacity: input.capacity ?? null,
            requireApproval: input.requireApproval ?? event.requireApproval,
            isPublic: input.isPublic ?? event.isPublic,
            status: input.status ?? event.status,
            updatedAt: new Date(),
          })
          .where("id", "=", event.id)
          .execute();

        return { success: true };
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new TRPCError({ code: "BAD_REQUEST", cause: error });
        }
        throw error;
      }
    }),

  delete: protectedProcedure
    .input(eventIdSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;
      await requireOrgRole(input.organizationId, userId, OrgRole.ADMIN);
      const event = await requireEvent(input.organizationId, input.eventId);

      await db
        .deleteFrom("RegistrationField")
        .where("eventId", "=", event.id)
        .execute();
      await db
        .deleteFrom("Registration")
        .where("eventId", "=", event.id)
        .execute();
      await db.deleteFrom("Event").where("id", "=", event.id).execute();

      return { success: true };
    }),

  listFields: protectedProcedure
    .input(z.object({ eventId: z.number().int().positive() }))
    .query(async ({ input }) => {
      return await db
        .selectFrom("RegistrationField")
        .selectAll()
        .where("eventId", "=", input.eventId)
        .orderBy("position", "asc")
        .execute();
    }),

  upsertField: protectedProcedure
    .input(eventFieldSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;

      try {
        const event = await db
          .selectFrom("Event")
          .select(["organizationId"])
          .where("id", "=", input.eventId)
          .executeTakeFirst();

        if (!event) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Event not found",
          });
        }

        await requireOrgRole(event.organizationId, userId, OrgRole.ADMIN);
        const organization = await requireOrganizationPlan(
          event.organizationId,
        );
        const entitlements = getPlanEntitlements(organization.plan);

        if (input.type === FieldType.SELECT && !input.options?.length) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Select fields need at least one option",
          });
        }

        if (input.id) {
          await db
            .updateTable("RegistrationField")
            .set({
              label: input.label,
              type: input.type,
              options: input.options?.join(",") ?? null,
              required: input.required ?? false,
              updatedAt: new Date(),
            })
            .where("id", "=", input.id)
            .where("eventId", "=", input.eventId)
            .execute();

          return { success: true };
        }

        const existing = await db
          .selectFrom("RegistrationField")
          .select((eb) => eb.fn.count<number>("id").as("count"))
          .where("eventId", "=", input.eventId)
          .executeTakeFirstOrThrow();

        if (
          !isWithinQuota(Number(existing.count), entitlements.maxCustomFields)
        ) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message:
              entitlements.maxCustomFields === 0
                ? "Custom registration fields require the Pro plan"
                : `Your plan allows ${entitlements.maxCustomFields} custom field(s)`,
          });
        }

        await db
          .insertInto("RegistrationField")
          .values({
            eventId: input.eventId,
            key: input.key,
            label: input.label,
            type: input.type,
            options: input.options?.join(",") ?? null,
            required: input.required ?? false,
            position: Number(existing.count),
          })
          .execute();

        return { success: true };
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new TRPCError({ code: "BAD_REQUEST", cause: error });
        }
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", cause: error });
      }
    }),

  deleteField: protectedProcedure
    .input(
      z.object({
        eventId: z.number().int().positive(),
        fieldId: z.number().int().positive(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;

      const event = await db
        .selectFrom("Event")
        .select(["organizationId"])
        .where("id", "=", input.eventId)
        .executeTakeFirst();

      if (!event) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
      }

      await requireOrgRole(event.organizationId, userId, OrgRole.ADMIN);

      await db
        .deleteFrom("RegistrationField")
        .where("id", "=", input.fieldId)
        .where("eventId", "=", input.eventId)
        .execute();

      return { success: true };
    }),

  reorderFields: protectedProcedure
    .input(fieldOrderSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;

      const event = await db
        .selectFrom("Event")
        .select(["organizationId"])
        .where("id", "=", input.eventId)
        .executeTakeFirst();

      if (!event) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Event not found" });
      }

      await requireOrgRole(event.organizationId, userId, OrgRole.ADMIN);

      await Promise.all(
        input.fieldIds.map((fieldId, index) =>
          db
            .updateTable("RegistrationField")
            .set({ position: index, updatedAt: new Date() })
            .where("id", "=", fieldId)
            .where("eventId", "=", input.eventId)
            .execute(),
        ),
      );

      return { success: true };
    }),
});
