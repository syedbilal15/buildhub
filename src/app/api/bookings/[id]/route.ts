import { db } from "@/db";
import { bookings, projects, units, clients, installmentSchedule, paymentHistory, activityLog } from "@/db/schema";
import { eq, count } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [bookingData] = await db
      .select({
        booking: bookings,
        project: projects,
        unit: units,
        client: clients,
      })
      .from(bookings)
      .leftJoin(projects, eq(bookings.projectId, projects.id))
      .leftJoin(units, eq(bookings.unitId, units.id))
      .leftJoin(clients, eq(bookings.clientId, clients.id))
      .where(eq(bookings.id, Number(id)));

    if (!bookingData) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const installments = await db
      .select()
      .from(installmentSchedule)
      .where(eq(installmentSchedule.bookingId, Number(id)))
      .orderBy(installmentSchedule.installmentNumber);

    const payments = await db
      .select()
      .from(paymentHistory)
      .where(eq(paymentHistory.bookingId, Number(id)))
      .orderBy(paymentHistory.paymentDate);

    return NextResponse.json({
      ...bookingData,
      installments,
      payments,
    });
  } catch (error) {
    console.error("Booking GET error:", error);
    return NextResponse.json({ error: "Failed to fetch booking" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const [existing] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, Number(id)));

    if (!existing) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (body.status === "cancelled") {
      const [paidCount] = await db
        .select({ count: count() })
        .from(paymentHistory)
        .where(eq(paymentHistory.bookingId, Number(id)));

      if (paidCount.count > 0) {
        return NextResponse.json({
          error: "This booking cannot be cancelled because payments have already been recorded. Please contact an administrator.",
        }, { status: 409 });
      }
    }

    const updateData: Record<string, unknown> = {};
    if (body.status) updateData.status = body.status;
    if (body.salePrice) updateData.salePrice = body.salePrice;
    if (body.cancellationReason) updateData.cancellationReason = body.cancellationReason;
    if (body.cancelledAt) updateData.cancelledAt = body.cancelledAt;

    const [updated] = await db
      .update(bookings)
      .set(updateData)
      .where(eq(bookings.id, Number(id)))
      .returning();

    if (body.status === "sold") {
      await db
        .update(units)
        .set({ status: "sold" })
        .where(eq(units.id, existing.unitId));

      await db.insert(activityLog).values({
        action: "booking_finalized",
        details: `Booking ${existing.referenceNumber} finalized as SOLD`,
        entityType: "booking",
        entityId: Number(id),
      });
    }

    if (body.status === "cancelled") {
      await db
        .update(units)
        .set({ status: "available" })
        .where(eq(units.id, existing.unitId));

      await db.insert(activityLog).values({
        action: "booking_cancelled",
        details: `Booking ${existing.referenceNumber} cancelled${body.cancellationReason ? `: ${body.cancellationReason}` : ""}`,
        entityType: "booking",
        entityId: Number(id),
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Booking PUT error:", error);
    return NextResponse.json({ error: "Failed to update booking" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bookingId = Number(id);

    const [existing] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, bookingId));

    if (!existing) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const [paidCount] = await db
      .select({ count: count() })
      .from(paymentHistory)
      .where(eq(paymentHistory.bookingId, bookingId));

    if (paidCount.count > 0) {
      return NextResponse.json({
        error: "This booking cannot be deleted because payments have already been recorded. Please cancel the booking instead.",
      }, { status: 409 });
    }

    await db
      .delete(installmentSchedule)
      .where(eq(installmentSchedule.bookingId, bookingId));

    await db
      .delete(bookings)
      .where(eq(bookings.id, bookingId));

    await db
      .update(units)
      .set({ status: "available" })
      .where(eq(units.id, existing.unitId));

    await db.insert(activityLog).values({
      action: "booking_deleted",
      details: `Booking ${existing.referenceNumber} for unit #${existing.unitId} deleted`,
      entityType: "booking",
      entityId: bookingId,
    });

    return NextResponse.json({ success: true, message: "Booking deleted successfully" });
  } catch (error) {
    console.error("Booking DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete booking" }, { status: 500 });
  }
}
