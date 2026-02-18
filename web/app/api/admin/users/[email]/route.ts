import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import {
  updateUserBlocked,
  updateUserRole,
  type UserRole,
} from "@/lib/supabase-users";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ email: string }> }
) {
  const session = await getSession();
  if (!session.isLoggedIn || session.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { email } = await params;
  const decodedEmail = decodeURIComponent(email);
  const body = await request.json();
  const role = body.role as UserRole | undefined;
  const blocked = body.blocked as boolean | undefined;

  if (typeof blocked === "boolean") {
    const ok = await updateUserBlocked(decodedEmail, blocked);
    if (!ok) {
      return NextResponse.json(
        { error: "Failed to update user" },
        { status: 500 }
      );
    }
  }
  if (role === "user" || role === "admin") {
    const ok = await updateUserRole(decodedEmail, role);
    if (!ok) {
      return NextResponse.json(
        { error: "Failed to update user" },
        { status: 500 }
      );
    }
  }
  return NextResponse.json({
    ok: true,
    ...(typeof blocked === "boolean" && { blocked }),
    ...(role && { role }),
  });
}
