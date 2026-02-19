import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getUserByEmail } from "@/lib/supabase-users";
import {
  getSavedResourceIdsForUser,
  addSavedResource,
  removeSavedResource,
} from "@/lib/supabase-saved-resources";

/** GET: List saved resource IDs for the current user. */
export async function GET() {
  const session = await getSession();
  if (!session.isLoggedIn || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const ids = await getSavedResourceIdsForUser(session.user.email);
  return NextResponse.json({ resourceIds: ids });
}

/** POST: Add a resource to saved list. Body: { resourceId: string } */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: { resourceId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const resourceId = typeof body.resourceId === "string" ? body.resourceId.trim() : "";
  if (!resourceId) {
    return NextResponse.json({ error: "Resource ID is required" }, { status: 400 });
  }
  const user = await getUserByEmail(session.user.email);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  const ok = await addSavedResource(user.id, resourceId);
  if (!ok) {
    return NextResponse.json({ error: "Failed to save resource" }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}

/** DELETE: Remove a resource from saved list. Query: ?id=resourceId */
export async function DELETE(request: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const resourceId = request.nextUrl.searchParams.get("id")?.trim() ?? "";
  if (!resourceId) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }
  const user = await getUserByEmail(session.user.email);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  const ok = await removeSavedResource(user.id, resourceId);
  if (!ok) {
    return NextResponse.json({ error: "Failed to remove resource" }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
