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
