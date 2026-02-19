import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getDownloadableById } from "@/lib/sanity";
import { getPresignedPreviewUrl } from "@/lib/s3";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Resource id required" }, { status: 400 });
  }
  const doc = await getDownloadableById(id);
  if (!doc) {
    return NextResponse.json({ error: "Resource not found" }, { status: 404 });
  }
  const url = await getPresignedPreviewUrl(doc.s3Key);
  if (!url) {
    return NextResponse.json(
      { error: "Preview not available" },
      { status: 503 }
    );
  }
  return NextResponse.json({ url });
}
