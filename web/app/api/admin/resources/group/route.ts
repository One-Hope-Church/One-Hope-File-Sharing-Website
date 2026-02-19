import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { createResourceGroup } from "@/lib/sanity";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || session.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await request.json();
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const sectionId = typeof body.sectionId === "string" ? body.sectionId.trim() : "";
  const resourceIds = Array.isArray(body.resourceIds)
    ? body.resourceIds.filter((id): id is string => typeof id === "string")
    : [];
  if (!title || !sectionId) {
    return NextResponse.json(
      { error: "title and sectionId are required" },
      { status: 400 }
    );
  }
  if (resourceIds.length === 0) {
    return NextResponse.json(
      { error: "At least one resourceId is required" },
      { status: 400 }
    );
  }
  const groupId = await createResourceGroup({
    title,
    sectionId,
    resourceIds,
  });
  if (!groupId) {
    return NextResponse.json(
      { error: "Failed to create group" },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true, groupId });
}
