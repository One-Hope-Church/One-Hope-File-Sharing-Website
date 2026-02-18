import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "One Hope Resources <onboarding@resend.dev>";

export async function sendOtpEmail(to: string, code: string): Promise<boolean> {
  if (!resend) {
    console.warn("RESEND_API_KEY not set; OTP email skipped. Code:", code);
    return true; // allow dev without Resend
  }
  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: [to],
    subject: "Your One Hope Resources sign-in code",
    html: `
      <p>Your one-time sign-in code is: <strong>${code}</strong></p>
      <p>This code expires in 10 minutes. If you didn't request this, you can ignore this email.</p>
      <p>— One Hope Resources</p>
    `,
  });
  if (error) {
    console.error("Resend error:", error);
    return false;
  }
  return true;
}
