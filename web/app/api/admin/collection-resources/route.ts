import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { createCollectionResource } from "@/lib/sanity";

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
      { error: "Title and file are required" },
      { status: 400 }
    );
  }
  const description = typeof body.description === "string" ? body.description.trim() || undefined : undefined;
  const fileType = typeof body.fileType === "string" ? body.fileType.trim() || undefined : undefined;

  const id = await createCollectionResource({
    title,
    s3Key,
    fileType,
    description,
  });
  if (!id) {
    return NextResponse.json(
      { error: "Failed to create collection resource" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, collectionResourceId: id });
}
