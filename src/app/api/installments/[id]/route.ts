import { db } from "@/db";
import { installmentSchedule, paymentHistory, activityLog, bookings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Update the installment
    const [updated] = await db
      .update(installmentSchedule)
      .set({
        paidAmount: body.paidAmount,
        paidDate: body.paidDate || new Date().toISOString().split("T")[0],
        status: body.status || "paid",
        receiptNumber: body.receiptNumber || null,
        paymentMethod: body.paymentMethod || null,
        notes: body.notes || null,
      })
      .where(eq(installmentSchedule.id, Number(id)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Installment not found" }, { status: 404 });
    }

    // Record in payment history
    await db.insert(paymentHistory).values({
      bookingId: updated.bookingId,
      installmentId: updated.id,
      amount: body.paidAmount,
      paymentDate: body.paidDate || new Date().toISOString().split("T")[0],
      paymentMethod: body.paymentMethod || null,
      receiptNumber: body.receiptNumber || null,
      notes: body.notes || null,
    });

    // Log activity
    await db.insert(activityLog).values({
      action: "payment_recorded",
      details: `Payment of ${body.paidAmount} recorded for installment #${updated.installmentNumber}`,
      entityType: "installment",
      entityId: Number(id),
    });

    // Check if all installments are paid - if so, update booking status
    const allInstallments = await db
      .select()
      .from(installmentSchedule)
      .where(eq(installmentSchedule.bookingId, updated.bookingId));

    const allPaid = allInstallments.every((i) => i.status === "paid");
    if (allPaid) {
      await db
        .update(bookings)
        .set({ status: "sold" })
        .where(eq(bookings.id, updated.bookingId));

      await db.insert(activityLog).values({
        action: "booking_auto_finalized",
        details: `All installments paid - booking auto-finalized as SOLD`,
        entityType: "booking",
        entityId: updated.bookingId,
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Installment PUT error:", error);
    return NextResponse.json({ error: "Failed to update installment" }, { status: 500 });
  }
}
