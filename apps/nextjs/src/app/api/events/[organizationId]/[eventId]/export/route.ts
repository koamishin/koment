import { NextResponse, type NextRequest } from "next/server";

import { getCurrentUser } from "@saasfly/auth";
import { db, OrgRole } from "@saasfly/db";

import { getPlanEntitlements } from "@saasfly/api/entitlements";
import { requireOrgRole } from "@saasfly/api/permissions";

export const runtime = "nodejs";

function toCsvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  const text = value instanceof Date ? value.toISOString() : String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { organizationId: string; eventId: string } },
) {
  const organizationId = Number(params.organizationId);
  const eventId = Number(params.eventId);

  if (
    !Number.isInteger(organizationId) ||
    organizationId <= 0 ||
    !Number.isInteger(eventId) ||
    eventId <= 0
  ) {
    return NextResponse.json({ error: "Invalid identifiers" }, { status: 400 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await requireOrgRole(organizationId, user.id, OrgRole.STAFF);

    const organization = await db
      .selectFrom("Organization")
      .select(["name", "plan"])
      .where("id", "=", organizationId)
      .executeTakeFirst();

    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 },
      );
    }

    if (!getPlanEntitlements(organization.plan).canCsvExport) {
      return NextResponse.json(
        { error: "CSV export requires the Business plan" },
        { status: 402 },
      );
    }

    const event = await db
      .selectFrom("Event")
      .select(["name"])
      .where("id", "=", eventId)
      .where("organizationId", "=", organizationId)
      .executeTakeFirst();

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const [registrations, fields] = await Promise.all([
      db
        .selectFrom("Registration")
        .selectAll()
        .where("organizationId", "=", organizationId)
        .where("eventId", "=", eventId)
        .orderBy("createdAt", "asc")
        .execute(),
      db
        .selectFrom("RegistrationField")
        .select(["key", "label"])
        .where("eventId", "=", eventId)
        .orderBy("position", "asc")
        .execute(),
    ]);

    const headers = [
      "name",
      "email",
      "phone",
      "status",
      ...fields.map((field) => field.label),
      "check_in_code",
      "checked_in_at",
      "check_in_method",
      "registered_at",
    ];

    const rows = registrations.map((registration) => {
      const answers =
        registration.answers && typeof registration.answers === "object"
          ? (registration.answers as Record<string, unknown>)
          : {};

      return [
        registration.name,
        registration.email,
        registration.phone,
        registration.status,
        ...fields.map((field) => answers[field.key]),
        registration.checkInCode,
        registration.checkedInAt,
        registration.checkInMethod,
        registration.createdAt,
      ];
    });

    const csv = [headers, ...rows]
      .map((row) => row.map(toCsvCell).join(","))
      .join("\r\n");

    const filename = `${organization.name}-${event.name}`
      .replace(/[^\w.-]+/g, "-")
      .toLowerCase();

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}.csv"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 403 });
  }
}
