import { db } from "@/db";
import { projects, units, projectUnits, activityLog } from "@/db/schema";
import { eq, ilike, or, and, desc, count } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const search = request.nextUrl.searchParams.get("search");
    const status = request.nextUrl.searchParams.get("status");

    const conditions = [];

    if (search) {
      conditions.push(
        or(
          ilike(projects.name, `%${search}%`),
          ilike(projects.projectCode, `%${search}%`),
          ilike(projects.location, `%${search}%`),
        )!
      );
    }
    if (status) {
      conditions.push(eq(projects.status, status));
    }

    const result = await db
      .select({
        project: projects,
        unitCount: count(units.id),
      })
      .from(projects)
      .leftJoin(units, eq(units.projectId, projects.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(projects.id)
      .orderBy(desc(projects.createdAt));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Projects GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const newProject = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(projects)
        .values({
          name: body.name,
          projectCode: body.projectCode || null,
          location: body.location || null,
          description: body.description || null,
          status: body.status || "active",
          launchDate: body.launchDate || null,
          completionDate: body.completionDate || null,
          amenities: body.amenities || [],
        })
        .returning();

      if (body.assignedUnitIds && body.assignedUnitIds.length > 0) {
        await tx.insert(projectUnits).values(
          body.assignedUnitIds.map((unitId: number) => ({
            projectId: created.id,
            unitId,
          }))
        );
      }

      await tx.insert(activityLog).values({
        action: "project_created",
        details: `Project "${body.name}" created`,
        entityType: "project",
        entityId: created.id,
      });

      return created;
    });

    return NextResponse.json(newProject, { status: 201 });
  } catch (error) {
    console.error("Projects POST error:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
