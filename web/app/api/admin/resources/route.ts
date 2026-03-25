import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { createResource } from "@/lib/sanity";
import { normalizeExternalUrl } from "@/lib/external-link";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || session.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await request.json();
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const s3Key = typeof body.s3Key === "string" ? body.s3Key.trim() : "";
  const externalRaw = typeof body.externalUrl === "string" ? body.externalUrl.trim() : "";
  const externalUrl = externalRaw ? normalizeExternalUrl(externalRaw) : null;
  if (!title || (!s3Key && !externalUrl)) {
    return NextResponse.json(
      { error: "Title and either a file or a valid http(s) link are required" },
      { status: 400 }
    );
  }
  const description = typeof body.description === "string" ? body.description.trim() : undefined;
  const fileType = typeof body.fileType === "string" ? body.fileType.trim() || undefined : undefined;
  const thumbnailAssetId = typeof body.thumbnailAssetId === "string" ? body.thumbnailAssetId.trim() || undefined : undefined;
  const sectionId = typeof body.sectionId === "string" ? body.sectionId.trim() || undefined : undefined;
  const order = typeof body.order === "number" ? body.order : undefined;

  const resourceId = await createResource({
    title,
    description,
    fileType,
    thumbnailAssetId,
    ...(s3Key ? { s3Key } : {}),
    ...(externalUrl ? { externalUrl } : {}),
    sectionId,
    order,
  });
  if (!resourceId) {
    return NextResponse.json(
      { error: "Failed to create resource" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, resourceId });
}
