import { getIronSession, SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export interface SessionUser {
  email: string;
  role: "user" | "admin";
}

export interface SessionData {
  user?: SessionUser;
  isLoggedIn: boolean;
}

const MIN_LENGTH = 32;
const defaultDevSecret = "dev-secret-onehope-resources-min-32-chars-long!!";
const sessionPassword =
  typeof process.env.SESSION_SECRET === "string" && process.env.SESSION_SECRET.length >= MIN_LENGTH
    ? process.env.SESSION_SECRET
    : defaultDevSecret;

const sessionOptions: SessionOptions = {
  password: sessionPassword,
  cookieName: "onehope_resources_session",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 7, // 1 week
  },
};

export async function getSession() {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
  if (!session.isLoggedIn) {
    session.isLoggedIn = false;
    session.user = undefined;
  }
  return session;
}

export async function setSession(user: SessionUser) {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
  session.user = user;
  session.isLoggedIn = true;
  await session.save();
}

export async function destroySession() {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
  session.destroy();
}

export function isAdmin(emailsCsv: string | undefined, email: string): boolean {
  if (!emailsCsv) return false;
  const list = emailsCsv.split(",").map((e) => e.trim().toLowerCase());
  return list.includes(email.toLowerCase());
}
