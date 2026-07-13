import { db } from "@/db";
import { projects, units, bookings, installmentSchedule, activityLog } from "@/db/schema";
import { eq, sql, count, sum, and } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [totalProjects] = await db.select({ count: count() }).from(projects);

    const [totalUnits] = await db.select({ count: count() }).from(units);

    const [availableUnits] = await db
      .select({ count: count() })
      .from(units)
      .where(eq(units.status, "available"));

    const [reservedUnits] = await db
      .select({ count: count() })
      .from(units)
      .where(eq(units.status, "reserved"));

    const [bookedUnits] = await db
      .select({ count: count() })
      .from(units)
      .where(eq(units.status, "booked"));

    const [soldUnits] = await db
      .select({ count: count() })
      .from(units)
      .where(eq(units.status, "sold"));

    const [revenueResult] = await db
      .select({ total: sum(bookings.salePrice) })
      .from(bookings);

    const [paidResult] = await db
      .select({ total: sum(installmentSchedule.paidAmount) })
      .from(installmentSchedule);

    const [pendingInstallments] = await db
      .select({ count: count() })
      .from(installmentSchedule)
      .where(eq(installmentSchedule.status, "pending"));

    const [overdueResult] = await db
      .select({ count: count() })
      .from(installmentSchedule)
      .where(
        and(
          eq(installmentSchedule.status, "pending"),
          sql`${installmentSchedule.dueDate} < CURRENT_DATE`
        )
      );

    const recentActivities = await db
      .select()
      .from(activityLog)
      .orderBy(sql`${activityLog.createdAt} DESC`)
      .limit(10);

    return NextResponse.json({
      totalProjects: totalProjects?.count ?? 0,
      totalUnits: totalUnits?.count ?? 0,
      availableUnits: availableUnits?.count ?? 0,
      reservedUnits: reservedUnits?.count ?? 0,
      bookedUnits: bookedUnits?.count ?? 0,
      soldUnits: soldUnits?.count ?? 0,
      totalRevenue: revenueResult?.total ?? "0",
      totalPaid: paidResult?.total ?? "0",
      pendingInstallments: pendingInstallments?.count ?? 0,
      overdueInstallments: overdueResult?.count ?? 0,
      recentActivities,
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      {
        totalProjects: 0,
        totalUnits: 0,
        availableUnits: 0,
        reservedUnits: 0,
        bookedUnits: 0,
        soldUnits: 0,
        totalRevenue: "0",
        totalPaid: "0",
        pendingInstallments: 0,
        overdueInstallments: 0,
        recentActivities: [],
      },
      { status: 500 }
    );
  }
}
