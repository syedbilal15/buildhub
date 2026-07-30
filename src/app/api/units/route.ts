import { db } from "@/db";
import { units, projects, projectUnits, activityLog } from "@/db/schema";
import { eq, ilike, or, and, desc, inArray } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const search = request.nextUrl.searchParams.get("search");
    const status = request.nextUrl.searchParams.get("status");
    const propertyType = request.nextUrl.searchParams.get("propertyType");
    const projectId = request.nextUrl.searchParams.get("projectId");

    const conditions = [];

    if (search) {
      conditions.push(
        or(
          ilike(units.unitNumber, `%${search}%`),
          ilike(units.name, `%${search}%`),
        )!
      );
    }
    if (status) {
      conditions.push(eq(units.status, status));
    }
    if (propertyType) {
      conditions.push(eq(units.propertyType, propertyType));
    }
    if (projectId) {
      conditions.push(eq(units.projectId, Number(projectId)));
    }

    const result = await db
      .select({
        unit: units,
        project: { id: projects.id, name: projects.name, projectCode: projects.projectCode },
      })
      .from(units)
      .leftJoin(projects, eq(units.projectId, projects.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(units.createdAt));

    const unitIds = result.map((r) => r.unit.id);
    const assignedProjectLinks =
      unitIds.length > 0
        ? await db
            .select({
              unitId: projectUnits.unitId,
              projectId: projectUnits.projectId,
              projectName: projects.name,
              projectCode: projects.projectCode,
            })
            .from(projectUnits)
            .innerJoin(projects, eq(projects.id, projectUnits.projectId))
            .where(inArray(projectUnits.unitId, unitIds))
        : [];

    const assignedMap: Record<number, { id: number; name: string; projectCode: string | null }[]> = {};
    for (const link of assignedProjectLinks) {
      if (!assignedMap[link.unitId]) assignedMap[link.unitId] = [];
      assignedMap[link.unitId].push({
        id: link.projectId,
        name: link.projectName,
        projectCode: link.projectCode,
      });
    }

    const enriched = result.map((r) => ({
      ...r,
      assignedProjects: assignedMap[r.unit.id] || [],
    }));

    return NextResponse.json(enriched);
  } catch (error) {
    console.error("Units GET error:", error);
    return NextResponse.json({ error: "Failed to fetch units" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const [newUnit] = await db
      .insert(units)
      .values({
        projectId: body.projectId,
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
      .returning();

    await db.insert(activityLog).values({
      action: "unit_created",
      details: `Unit "${body.unitNumber}" created in project #${body.projectId}`,
      entityType: "unit",
      entityId: newUnit.id,
    });

    return NextResponse.json(newUnit, { status: 201 });
  } catch (error) {
    console.error("Units POST error:", error);
    return NextResponse.json({ error: "Failed to create unit" }, { status: 500 });
  }
}
