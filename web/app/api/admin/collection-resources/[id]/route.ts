import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { updateCollectionResource } from "@/lib/sanity";

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
  let body: { title?: string; description?: string; fileType?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const updates: { title?: string; description?: string; fileType?: string } = {};
  if (typeof body.title === "string") updates.title = body.title.trim();
  if (typeof body.description === "string") updates.description = body.description.trim() || undefined;
  if (typeof body.fileType === "string" && body.fileType.trim())
    updates.fileType = body.fileType.trim();

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
