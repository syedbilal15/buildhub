import { db } from "@/db";
import { units, projects, bookings, clients, installmentSchedule, paymentHistory, activityLog } from "@/db/schema";
import { eq, count } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const unitId = Number(id);

    const [unit] = await db
      .select({
        unit: units,
        project: { id: projects.id, name: projects.name, projectCode: projects.projectCode, location: projects.location },
      })
      .from(units)
      .leftJoin(projects, eq(units.projectId, projects.id))
      .where(eq(units.id, unitId));

    if (!unit) {
      return NextResponse.json({ error: "Unit not found" }, { status: 404 });
    }

    const bookingList = await db
      .select({
        booking: bookings,
        client: clients,
      })
      .from(bookings)
      .leftJoin(clients, eq(bookings.clientId, clients.id))
      .where(eq(bookings.unitId, unitId))
      .orderBy(bookings.createdAt);

    return NextResponse.json({ ...unit, bookings: bookingList });
  } catch (error) {
    console.error("Unit GET error:", error);
    return NextResponse.json({ error: "Failed to fetch unit" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const [updated] = await db
      .update(units)
      .set({
        unitNumber: body.unitNumber,
        name: body.name || null,
        floor: body.floor || null,
        tower: body.tower || null,
        block: body.block || null,
        propertyType: body.propertyType || "apartment",
        area: body.area || null,
        areaUnit: body.areaUnit || "sq ft",
        bedrooms: body.bedrooms || null,
        bathrooms: body.bathrooms || null,
        price: body.price,
        facing: body.facing || null,
        cornerUnit: body.cornerUnit || false,
        status: body.status || "available",
        description: body.description || null,
      })
      .where(eq(units.id, Number(id)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Unit not found" }, { status: 404 });
    }

    await db.insert(activityLog).values({
      action: "unit_updated",
      details: `Unit "${body.unitNumber}" updated`,
      entityType: "unit",
      entityId: Number(id),
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Unit PUT error:", error);
    return NextResponse.json({ error: "Failed to update unit" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const unitId = Number(id);

    const [bookingCount] = await db
      .select({ count: count() })
      .from(bookings)
      .where(eq(bookings.unitId, unitId));

    if (bookingCount.count > 0) {
      return NextResponse.json(
        { error: `Cannot delete unit with ${bookingCount.count} active booking(s). Remove bookings first.` },
        { status: 409 }
      );
    }

    const [deleted] = await db
      .delete(units)
      .where(eq(units.id, unitId))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Unit not found" }, { status: 404 });
    }

    await db.insert(activityLog).values({
      action: "unit_deleted",
      details: `Unit "${deleted.unitNumber}" deleted from project #${deleted.projectId}`,
      entityType: "unit",
      entityId: unitId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Unit DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete unit" }, { status: 500 });
  }
}
