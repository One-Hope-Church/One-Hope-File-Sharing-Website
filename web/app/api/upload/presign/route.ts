import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getPresignedUploadUrl } from "@/lib/s3";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || session.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await request.json();
  const filename = typeof body.filename === "string" ? body.filename.trim() : "";
  const contentType = typeof body.contentType === "string" ? body.contentType.trim() : "application/octet-stream";
  const collectionId = typeof body.collectionId === "string" ? body.collectionId : "uploads";
  if (!filename) {
    return NextResponse.json({ error: "filename required" }, { status: 400 });
  }
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  const key = `collections/${collectionId}/${Date.now()}-${safeName}`;
  const url = await getPresignedUploadUrl(key, contentType);
  if (!url) {
    return NextResponse.json(
      { error: "Upload not configured" },
      { status: 503 }
    );
  }
  return NextResponse.json({ url, key });
}
