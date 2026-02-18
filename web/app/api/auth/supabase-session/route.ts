import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUser, isSupabaseConfigured } from "@/lib/supabase-users";
import { setSession } from "@/lib/session";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * After client calls verifyOtp, they send the Supabase access_token here.
 * We look up the user by token, get/create in public.users, check blocked, set our session.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const accessToken = typeof body.access_token === "string" ? body.access_token.trim() : "";
    if (!accessToken || !supabaseUrl) {
      return NextResponse.json(
        { error: "Missing token or Supabase URL" },
        { status: 400 }
      );
    }
    if (!supabaseAnonKey) {
      return NextResponse.json(
        { error: "Server missing Supabase anon key" },
        { status: 500 }
      );
    }

    const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        apikey: supabaseAnonKey,
      },
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error("Supabase auth/v1/user error:", res.status, errText);
      return NextResponse.json(
        { error: "Invalid or expired code" },
        { status: 401 }
      );
    }
    const data = await res.json();
    const email = data?.email as string | undefined;
    if (!email) {
      return NextResponse.json(
        { error: "Could not get user email" },
        { status: 400 }
      );
    }

    if (!isSupabaseConfigured()) {
      return NextResponse.json(
        { error: "User database not configured" },
        { status: 500 }
      );
    }

    const appUser = await getOrCreateUser(email);
    if (!appUser) {
      return NextResponse.json(
        { error: "Could not load user" },
        { status: 500 }
      );
    }
    if (appUser.blocked) {
      return NextResponse.json(
        { error: "Your account has been disabled. Contact an administrator." },
        { status: 403 }
      );
    }

    await setSession({
      email: appUser.email,
      role: appUser.role as "user" | "admin",
    });
    return NextResponse.json({ ok: true, role: appUser.role });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
