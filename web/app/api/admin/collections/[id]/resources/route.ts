import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getCollectionResourcesForAdmin } from "@/lib/sanity";

export async function GET(
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
  const resources = await getCollectionResourcesForAdmin(id);
  return NextResponse.json({ resources });
}
