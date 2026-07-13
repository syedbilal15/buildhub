import { db } from "@/db";
import { units } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await db
      .select()
      .from(units)
      .where(eq(units.projectId, Number(id)))
      .orderBy(units.unitNumber);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Project units GET error:", error);
    return NextResponse.json({ error: "Failed to fetch units" }, { status: 500 });
  }
}
