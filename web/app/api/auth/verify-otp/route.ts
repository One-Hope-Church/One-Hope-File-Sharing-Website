import { NextRequest, NextResponse } from "next/server";
import { getAndDeleteOtp } from "@/lib/otp-store";
import { setSession, isAdmin } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const code = typeof body.code === "string" ? body.code.trim() : "";
    if (!email || !code) {
      return NextResponse.json(
        { error: "Email and code are required" },
        { status: 400 }
      );
    }
    const stored = getAndDeleteOtp(email);
    if (!stored || stored !== code) {
      return NextResponse.json(
        { error: "Invalid or expired code" },
        { status: 400 }
      );
    }
    const role = isAdmin(process.env.ADMIN_EMAILS, email) ? "admin" : "user";
    await setSession({ email, role });
    return NextResponse.json({ ok: true, role });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
