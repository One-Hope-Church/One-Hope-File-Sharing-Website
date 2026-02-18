import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { listUsers } from "@/lib/supabase-users";

export async function GET() {
  const session = await getSession();
  if (!session.isLoggedIn || session.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const users = await listUsers();
  return NextResponse.json(users);
}
