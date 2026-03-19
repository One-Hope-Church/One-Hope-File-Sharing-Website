import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { searchContent } from "@/lib/sanity";

const MAX_DROPDOWN_COLLECTIONS = 5;
const MAX_DROPDOWN_RESOURCES = 5;

/** GET: Search collections and resources. Query: ?q=searchTerm. Requires login. */
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const q = request.nextUrl.searchParams.get("q");
  const query = typeof q === "string" ? q.trim() : "";
  if (query.length < 2) {
    return NextResponse.json({ collections: [], resources: [] });
  }

  const result = await searchContent(query);
  return NextResponse.json({
    collections: result.collections.slice(0, MAX_DROPDOWN_COLLECTIONS),
    resources: result.resources.slice(0, MAX_DROPDOWN_RESOURCES),
  });
}
