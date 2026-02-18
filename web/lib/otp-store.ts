// In-memory OTP store. For production, use Redis or a DB with TTL.
const otpStore = new Map<
  string,
  { code: string; expiresAt: number }
>();

const TTL_MS = 10 * 60 * 1000; // 10 minutes

export function setOtp(email: string, code: string): void {
  const key = email.trim().toLowerCase();
  otpStore.set(key, {
    code,
    expiresAt: Date.now() + TTL_MS,
  });
}

export function getAndDeleteOtp(email: string): string | null {
  const key = email.trim().toLowerCase();
  const entry = otpStore.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    otpStore.delete(key);
    return null;
  }
  otpStore.delete(key);
  return entry.code;
}

function cleanup(): void {
  const now = Date.now();
  Array.from(otpStore.entries()).forEach(([k, v]) => {
    if (now > v.expiresAt) otpStore.delete(k);
  });
}
if (typeof setInterval !== "undefined") {
  setInterval(cleanup, 60 * 1000);
}
