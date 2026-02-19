import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { reorderCollectionResources } from "@/lib/sanity";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || session.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  let body: { collectionId?: string; resourceIds?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const collectionId = typeof body.collectionId === "string" ? body.collectionId.trim() : "";
  const resourceIds = Array.isArray(body.resourceIds)
    ? body.resourceIds.filter((id): id is string => typeof id === "string" && id.length > 0)
    : [];
  if (!collectionId || resourceIds.length === 0) {
    return NextResponse.json(
      { error: "collectionId and non-empty resourceIds required" },
      { status: 400 }
    );
  }
  const ok = await reorderCollectionResources(collectionId, resourceIds);
  if (!ok) {
    return NextResponse.json(
      { error: "Failed to reorder" },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true });
}
