import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getDownloadableById } from "@/lib/sanity";
import { getPresignedDownloadUrl } from "@/lib/s3";
import { logDownload } from "@/lib/supabase-download-log";
import { normalizeExternalUrl } from "@/lib/external-link";

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

  let url: string | null = null;
  if (doc.s3Key) {
    url = await getPresignedDownloadUrl(doc.s3Key);
    if (!url) {
      return NextResponse.json(
        { error: "Download not configured" },
        { status: 503 }
      );
    }
  } else if (doc.externalUrl) {
    url = normalizeExternalUrl(doc.externalUrl);
    if (!url) {
      return NextResponse.json({ error: "Invalid link" }, { status: 400 });
    }
  }

  if (!url) {
    return NextResponse.json({ error: "Resource not found" }, { status: 404 });
  }

  if (session.user?.email) {
    try {
      await logDownload(session.user.email, id);
    } catch {
      // Don't fail the download if logging fails
    }
  }
  // Return URL as JSON so client can open it directly (avoids redirect handling issues)
  const acceptsJson = request.headers.get("accept")?.includes("application/json");
  if (acceptsJson) {
    return NextResponse.json({ url });
  }
  return NextResponse.redirect(url, 302);
}
