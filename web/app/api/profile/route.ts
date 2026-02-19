import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import {
  getUserProfile,
  updateUserProfile,
  isProfileComplete,
  type UserProfile,
} from "@/lib/supabase-users";

export async function GET() {
  const session = await getSession();
  if (!session.isLoggedIn || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const profile = await getUserProfile(session.user.email);
  if (!profile) {
    return NextResponse.json({ profile: null, complete: false });
  }
  return NextResponse.json({
    profile,
    complete: isProfileComplete(profile),
  });
}

export async function PATCH(request: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || !session.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: Partial<UserProfile>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const ok = await updateUserProfile(session.user.email, body);
  if (!ok) {
    return NextResponse.json({ error: "Failed to save profile" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
