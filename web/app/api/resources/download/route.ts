import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getResourceById } from "@/lib/sanity";
import { getPresignedDownloadUrl } from "@/lib/s3";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Resource id required" }, { status: 400 });
  }
  const resource = await getResourceById(id);
  if (!resource || typeof resource.s3Key !== "string") {
    return NextResponse.json({ error: "Resource not found" }, { status: 404 });
  }
  const url = await getPresignedDownloadUrl(resource.s3Key as string);
  if (!url) {
    return NextResponse.json(
      { error: "Download not configured" },
      { status: 503 }
    );
  }
  return NextResponse.redirect(url);
}
