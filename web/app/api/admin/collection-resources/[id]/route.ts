import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { updateCollectionResource, deleteCollectionResource } from "@/lib/sanity";
import { normalizeExternalUrl } from "@/lib/external-link";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session.isLoggedIn || session.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }
  let body: { title?: string; description?: string; fileType?: string; externalUrl?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const updates: { title?: string; description?: string; fileType?: string; externalUrl?: string } =
    {};
  if (typeof body.title === "string") updates.title = body.title.trim();
  if (typeof body.description === "string") updates.description = body.description.trim() || undefined;
  if (typeof body.fileType === "string" && body.fileType.trim())
    updates.fileType = body.fileType.trim();
  if (typeof body.externalUrl === "string") {
    const raw = body.externalUrl.trim();
    if (raw) {
      const normalized = normalizeExternalUrl(raw);
      if (!normalized) {
        return NextResponse.json({ error: "Invalid external URL" }, { status: 400 });
      }
      updates.externalUrl = normalized;
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No updates provided" }, { status: 400 });
  }
  const ok = await updateCollectionResource(id, updates);
  if (!ok) {
    return NextResponse.json(
      { error: "Failed to update" },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session.isLoggedIn || session.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }
  const ok = await deleteCollectionResource(id);
  if (!ok) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
