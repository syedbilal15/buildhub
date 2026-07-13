import { db } from "@/db";
import { bookings, projects, units, clients, installmentSchedule, activityLog } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const result = await db
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
      .orderBy(desc(bookings.createdAt));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Bookings GET error:", error);
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const refNumber = `AHD-${Date.now().toString(36).toUpperCase()}`;

    const [newBooking] = await db
      .insert(bookings)
      .values({
        projectId: body.projectId,
        unitId: body.unitId,
        clientId: body.clientId,
        salePrice: body.salePrice,
        downPayment: body.downPayment || "0",
        paymentType: body.paymentType || "installment",
        installmentCount: body.installmentCount || 0,
        installmentFrequency: body.installmentFrequency || "monthly",
        installmentAmount: body.installmentAmount || null,
        bookingDate: body.bookingDate,
        status: "booked",
        referenceNumber: refNumber,
      })
      .returning();

    await db
      .update(units)
      .set({ status: "booked" })
      .where(eq(units.id, body.unitId));

    if (body.paymentType === "installment" && body.installmentCount > 0) {
      const scheduleEntries = [];
      const startDate = new Date(body.bookingDate);
      const frequencyMonths =
        body.installmentFrequency === "quarterly" ? 3 : 1;

      for (let i = 1; i <= body.installmentCount; i++) {
        const dueDate = new Date(startDate);
        dueDate.setMonth(dueDate.getMonth() + i * frequencyMonths);

        scheduleEntries.push({
          bookingId: newBooking.id,
          installmentNumber: i,
          dueDate: dueDate.toISOString().split("T")[0],
          amount: body.installmentAmount,
          paidAmount: "0",
          status: "pending",
        });
      }

      if (scheduleEntries.length > 0) {
        await db.insert(installmentSchedule).values(scheduleEntries);
      }
    }

    await db.insert(activityLog).values({
      action: "booking_created",
      details: `Booking ${refNumber} created for unit #${body.unitId}`,
      entityType: "booking",
      entityId: newBooking.id,
    });

    return NextResponse.json(newBooking, { status: 201 });
  } catch (error) {
    console.error("Bookings POST error:", error);
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }
}
