import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getSectionsForAdmin } from "@/lib/sanity";

export async function GET() {
  const session = await getSession();
  if (!session.isLoggedIn || session.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const sections = await getSectionsForAdmin();
  return NextResponse.json(sections);
}
