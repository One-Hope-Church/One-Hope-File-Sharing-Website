import { supabaseAdmin, isSupabaseConfigured as checkSupabase } from "./supabase-server";

export const isSupabaseConfigured = checkSupabase;

export type UserRole = "user" | "admin";

export interface AppUser {
  id: string;
  email: string;
  role: UserRole;
  blocked: boolean;
  created_at: string;
  updated_at: string;
}

export async function getOrCreateUser(email: string): Promise<AppUser | null> {
  if (!supabaseAdmin || !isSupabaseConfigured()) return null;
  const normalized = email.trim().toLowerCase();
  const { data: existing } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("email", normalized)
    .single();

  if (existing) {
    return { ...existing, blocked: Boolean((existing as { blocked?: boolean }).blocked) } as AppUser;
  }

  const adminEmails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const initialRole = adminEmails.includes(normalized) ? "admin" : "user";

  const { data: inserted, error } = await supabaseAdmin
    .from("users")
    .insert({
      email: normalized,
      role: initialRole,
    })
    .select()
    .single();

  if (error) {
    console.error("Supabase insert user:", error);
    return null;
  }
  return { ...inserted, blocked: false } as AppUser;
}

export async function getUserByEmail(email: string): Promise<AppUser | null> {
  if (!supabaseAdmin || !isSupabaseConfigured()) return null;
  const { data } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("email", email.trim().toLowerCase())
    .single();
  if (!data) return null;
  return { ...data, blocked: Boolean((data as { blocked?: boolean }).blocked) } as AppUser;
}

export async function updateUserRole(
  email: string,
  role: UserRole
): Promise<boolean> {
  if (!supabaseAdmin || !isSupabaseConfigured()) return false;
  const { error } = await supabaseAdmin
    .from("users")
    .update({ role, updated_at: new Date().toISOString() })
    .eq("email", email.trim().toLowerCase());
  if (error) {
    console.error("Supabase update role:", error);
    return false;
  }
  return true;
}

export async function updateUserBlocked(
  email: string,
  blocked: boolean
): Promise<boolean> {
  if (!supabaseAdmin || !isSupabaseConfigured()) return false;
  const { error } = await supabaseAdmin
    .from("users")
    .update({ blocked, updated_at: new Date().toISOString() })
    .eq("email", email.trim().toLowerCase());
  if (error) {
    console.error("Supabase update blocked:", error);
    return false;
  }
  return true;
}

export interface UserProfile {
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  church_name: string | null;
  church_city: string | null;
  church_state: string | null;
}

/** Profile is complete if first and last name are set. */
export function isProfileComplete(p: UserProfile | null): boolean {
  if (!p) return false;
  const fn = (p.first_name ?? "").trim();
  const ln = (p.last_name ?? "").trim();
  return fn.length > 0 && ln.length > 0;
}

export async function getUserProfile(email: string): Promise<UserProfile | null> {
  if (!supabaseAdmin || !isSupabaseConfigured()) return null;
  const { data } = await supabaseAdmin
    .from("users")
    .select("first_name, last_name, phone, church_name, church_city, church_state")
    .eq("email", email.trim().toLowerCase())
    .single();
  if (!data) return null;
  return data as UserProfile;
}

export async function updateUserProfile(
  email: string,
  profile: Partial<UserProfile>
): Promise<boolean> {
  if (!supabaseAdmin || !isSupabaseConfigured()) return false;
  const payload: Record<string, string | null> = {};
  if (profile.first_name !== undefined) payload.first_name = profile.first_name?.trim() || null;
  if (profile.last_name !== undefined) payload.last_name = profile.last_name?.trim() || null;
  if (profile.phone !== undefined) payload.phone = profile.phone?.trim() || null;
  if (profile.church_name !== undefined) payload.church_name = profile.church_name?.trim() || null;
  if (profile.church_city !== undefined) payload.church_city = profile.church_city?.trim() || null;
  if (profile.church_state !== undefined) payload.church_state = profile.church_state?.trim() || null;
  if (Object.keys(payload).length === 0) return true;
  payload.updated_at = new Date().toISOString();
  const { error } = await supabaseAdmin
    .from("users")
    .update(payload)
    .eq("email", email.trim().toLowerCase());
  if (error) {
    console.error("Supabase update profile:", error);
    return false;
  }
  return true;
}

export async function listUsers(): Promise<AppUser[]> {
  if (!supabaseAdmin || !isSupabaseConfigured()) return [];
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Supabase list users:", error);
    return [];
  }
  return ((data as (AppUser & { blocked?: boolean })[]) || []).map((u) => ({
    ...u,
    blocked: Boolean(u.blocked),
  })) as AppUser[];
}
