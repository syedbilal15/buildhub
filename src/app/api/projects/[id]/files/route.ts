import { db } from "@/db";
import { projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads", "projects");
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

function sanitizeFileName(name: string) {
  return path.basename(name).replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const projectId = Number(id);

    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId));

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const files = formData
      .getAll("files")
      .filter((item): item is File => item instanceof File && item.size > 0);

    if (files.length === 0) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }

    const allowedFiles = files.filter((file) => {
      return (
        file.type.startsWith("image/") || file.type === "application/pdf"
      );
    });

    if (allowedFiles.length !== files.length) {
      return NextResponse.json(
        { error: "Only image and PDF files are allowed" },
        { status: 415 }
      );
    }

    // Validate file sizes first
    for (const file of allowedFiles) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File ${file.name} exceeds the 10MB upload limit` },
          { status: 413 }
        );
      }
    }

    const uploadDir = path.join(UPLOAD_ROOT, String(projectId));
    await fs.mkdir(uploadDir, { recursive: true });

    const images = (project.images as string[]) || [];
    const documents = (project.documents as Array<{ name: string; url: string }>) || [];

    const uploadedFiles: { type: 'image' | 'pdf'; name: string; url: string }[] = [];

    for (const file of allowedFiles) {
      try {
        const extension = path.extname(file.name) || (file.type === "application/pdf" ? ".pdf" : ".img");
        const fileName = `${Date.now()}-${randomUUID()}${extension}`;
        const safeName = sanitizeFileName(fileName);
        const filePath = path.join(uploadDir, safeName);
        const buffer = Buffer.from(await file.arrayBuffer());

        await fs.writeFile(filePath, buffer);

        const publicUrl = `/uploads/projects/${projectId}/${safeName}`;
        if (file.type === "application/pdf") {
          documents.push({ name: file.name, url: publicUrl });
          uploadedFiles.push({ type: 'pdf', name: file.name, url: publicUrl });
        } else {
          images.push(publicUrl);
          uploadedFiles.push({ type: 'image', name: file.name, url: publicUrl });
        }
      } catch (fileError) {
        console.error(`Error uploading file ${file.name}:`, fileError);
        throw new Error(`Failed to upload ${file.name}: ${fileError instanceof Error ? fileError.message : 'Unknown error'}`);
      }
    }

    try {
      const [updated] = await db
        .update(projects)
        .set({ images, documents })
        .where(eq(projects.id, projectId))
        .returning();

      return NextResponse.json({ 
        images: updated.images, 
        documents: updated.documents,
        uploadedCount: uploadedFiles.length
      });
    } catch (dbError) {
      console.error("Database update error:", dbError);
      throw new Error(`Failed to save files to database: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`);
    }
  } catch (error) {
    console.error("Project files upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to upload project files" },
      { status: 500 }
    );
  }
}
