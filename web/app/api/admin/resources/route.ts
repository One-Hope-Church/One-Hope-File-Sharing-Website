import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { createResource } from "@/lib/sanity";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || session.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await request.json();
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const s3Key = typeof body.s3Key === "string" ? body.s3Key.trim() : "";
  if (!title || !s3Key) {
    return NextResponse.json(
      { error: "title and s3Key are required" },
      { status: 400 }
    );
  }
  const description = typeof body.description === "string" ? body.description.trim() : undefined;
  const fileType = typeof body.fileType === "string" ? body.fileType.trim() || undefined : undefined;
  const sectionId = typeof body.sectionId === "string" ? body.sectionId.trim() || undefined : undefined;
  const order = typeof body.order === "number" ? body.order : undefined;

  const resourceId = await createResource({
    title,
    description,
    fileType,
    s3Key,
    sectionId,
    order,
  });
  if (!resourceId) {
    return NextResponse.json(
      { error: "Failed to create resource (check SANITY_API_TOKEN)" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, resourceId });
}
