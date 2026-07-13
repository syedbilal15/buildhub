import { db } from "@/db";
import { clients } from "@/db/schema";
import { ilike, or, desc } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const search = request.nextUrl.searchParams.get("search");

    if (search) {
      const result = await db
        .select()
        .from(clients)
        .where(
          or(
            ilike(clients.name, `%${search}%`),
            ilike(clients.cnic, `%${search}%`),
            ilike(clients.phone, `%${search}%`)
          )!
        )
        .orderBy(desc(clients.createdAt));
      return NextResponse.json(result);
    }

    const result = await db.select().from(clients).orderBy(desc(clients.createdAt));
    return NextResponse.json(result);
  } catch (error) {
    console.error("Clients GET error:", error);
    return NextResponse.json({ error: "Failed to fetch clients" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const [newClient] = await db
      .insert(clients)
      .values({
        name: body.name,
        cnic: body.cnic,
        phone: body.phone,
        email: body.email || null,
        address: body.address || null,
      })
      .returning();

    return NextResponse.json(newClient, { status: 201 });
  } catch (error) {
    console.error("Clients POST error:", error);
    return NextResponse.json({ error: "Failed to create client" }, { status: 500 });
  }
}
