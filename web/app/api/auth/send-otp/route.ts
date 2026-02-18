import { NextRequest, NextResponse } from "next/server";
import { setOtp } from "@/lib/otp-store";
import { sendOtpEmail } from "@/lib/resend";

function randomCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim() : "";
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }
    const code = randomCode();
    setOtp(email, code);
    const sent = await sendOtpEmail(email, code);
    if (!sent) {
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 }
      );
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
