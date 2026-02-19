import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { createResourceCollection } from "@/lib/sanity";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || session.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const title =
    typeof (body as Record<string, unknown>).title === "string"
      ? (body as Record<string, unknown>).title.trim()
      : "";
  const sectionId =
    typeof (body as Record<string, unknown>).sectionId === "string"
      ? (body as Record<string, unknown>).sectionId.trim()
      : "";
  const description =
    typeof (body as Record<string, unknown>).description === "string"
      ? (body as Record<string, unknown>).description.trim() || undefined
      : undefined;
  const collectionResourceIds = (body as Record<string, unknown>).collectionResourceIds;
  const ids = Array.isArray(collectionResourceIds)
    ? collectionResourceIds.filter((id): id is string => typeof id === "string" && id.length > 0)
    : [];

  if (!title || !sectionId) {
    return NextResponse.json(
      { error: "title and sectionId are required" },
      { status: 400 }
    );
  }
  if (ids.length === 0) {
    return NextResponse.json(
      { error: "At least one collectionResourceId is required" },
      { status: 400 }
    );
  }

  const collectionId = await createResourceCollection({
    title,
    sectionId,
    collectionResourceIds: ids,
    description,
  });

  if (!collectionId) {
    return NextResponse.json(
      { error: "Failed to create collection" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, collectionId });
}
