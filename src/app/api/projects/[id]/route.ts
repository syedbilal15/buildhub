import { db } from "@/db";
import { projects, units, bookings, activityLog } from "@/db/schema";
import { eq, count } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, Number(id)));

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }
    return NextResponse.json(project);
  } catch (error) {
    console.error("Project GET error:", error);
    return NextResponse.json({ error: "Failed to fetch project" }, { status: 500 });
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
      .update(projects)
      .set({
        name: body.name,
        projectCode: body.projectCode || null,
        location: body.location || null,
        description: body.description || null,
        status: body.status || "active",
        launchDate: body.launchDate || null,
        completionDate: body.completionDate || null,
        amenities: body.amenities || [],
      })
      .where(eq(projects.id, Number(id)))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    await db.insert(activityLog).values({
      action: "project_updated",
      details: `Project "${body.name}" updated`,
      entityType: "project",
      entityId: Number(id),
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Project PUT error:", error);
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const projectId = Number(id);

    const [unitCount] = await db
      .select({ count: count() })
      .from(units)
      .where(eq(units.projectId, projectId));

    if (unitCount.count > 0) {
      return NextResponse.json(
        { error: `Cannot delete project with ${unitCount.count} unit(s). Remove all units first.` },
        { status: 409 }
      );
    }

    const [deleted] = await db
      .delete(projects)
      .where(eq(projects.id, projectId))
      .returning();

    if (!deleted) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    await db.insert(activityLog).values({
      action: "project_deleted",
      details: `Project "${deleted.name}" deleted`,
      entityType: "project",
      entityId: projectId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Project DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
  }
}
