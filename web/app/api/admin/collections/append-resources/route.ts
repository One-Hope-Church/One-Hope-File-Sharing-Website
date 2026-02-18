import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { appendResourcesToCollection } from "@/lib/sanity";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || session.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON" },
      { status: 400 }
    );
  }

  const collectionId =
    typeof (body as Record<string, unknown>).collectionId === "string"
      ? (body as Record<string, unknown>).collectionId.trim()
      : "";
  const resourceIds = (body as Record<string, unknown>).resourceIds;
  const ids = Array.isArray(resourceIds)
    ? resourceIds.filter((id): id is string => typeof id === "string" && id.length > 0)
    : [];

  if (!collectionId || ids.length === 0) {
    return NextResponse.json(
      { error: "collectionId and non-empty resourceIds are required" },
      { status: 400 }
    );
  }

  const ok = await appendResourcesToCollection(collectionId, ids);
  if (!ok) {
    return NextResponse.json(
      { error: "Failed to append resources (check SANITY_API_TOKEN)" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
