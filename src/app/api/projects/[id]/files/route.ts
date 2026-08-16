import { db } from "@/db";
import { projects } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

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

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      throw new Error(
        "Cloudinary configuration is missing. Set CLOUDINARY_CLOUD_NAME and CLOUDINARY_UPLOAD_PRESET."
      );
    }

    const images = (project.images as string[]) || [];
    const documents =
      (project.documents as Array<{ name: string; url: string }>) || [];

    const uploadedFiles: Array<{ type: "image" | "pdf"; name: string; url: string }> = [];

    for (const file of allowedFiles) {
      try {
        const cloudinaryFormData = new FormData();
        cloudinaryFormData.append("file", file);
        cloudinaryFormData.append("upload_preset", uploadPreset);
        cloudinaryFormData.append("folder", `buildhub/projects/${projectId}`);

        const cloudinaryResponse = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
          {
            method: "POST",
            body: cloudinaryFormData,
          }
        );

        const responseText = await cloudinaryResponse.text();
        let cloudinaryResult: any;

        try {
          cloudinaryResult = JSON.parse(responseText);
        } catch {
          cloudinaryResult = {};
        }

        if (!cloudinaryResponse.ok || !cloudinaryResult?.secure_url) {
          const message =
            cloudinaryResult?.error?.message ||
            responseText ||
            `Cloudinary upload failed for ${file.name}`;
          throw new Error(message);
        }

        const secureUrl = cloudinaryResult.secure_url as string;

        if (file.type === "application/pdf") {
          documents.push({ name: file.name, url: secureUrl });
          uploadedFiles.push({
            type: "pdf",
            name: file.name,
            url: secureUrl,
          });
        } else {
          images.push(secureUrl);
          uploadedFiles.push({
            type: "image",
            name: file.name,
            url: secureUrl,
          });
        }
      } catch (fileError) {
        console.error(`Error uploading file ${file.name}:`, fileError);
        throw new Error(
          `Failed to upload ${file.name}: ${fileError instanceof Error ? fileError.message : "Unknown error"}`
        );
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
