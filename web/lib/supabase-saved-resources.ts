import { supabaseAdmin, isSupabaseConfigured } from "./supabase-server";
import { getUserByEmail } from "./supabase-users";

/** Get saved resource sanity_ids for a user by email. */
export async function getSavedResourceIdsForUser(email: string): Promise<string[]> {
  if (!supabaseAdmin || !isSupabaseConfigured()) return [];
  const user = await getUserByEmail(email);
  if (!user) return [];
  const { data, error } = await supabaseAdmin
    .from("user_saved_resources")
    .select("sanity_id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Supabase getSavedResourceIds:", error);
    return [];
  }
  return (data ?? []).map((r) => r.sanity_id);
}

/** Add a resource to user's saved list. Returns true on success. */
export async function addSavedResource(userId: string, sanityId: string): Promise<boolean> {
  if (!supabaseAdmin || !isSupabaseConfigured() || !sanityId.trim()) return false;
  const { error } = await supabaseAdmin.from("user_saved_resources").upsert(
    { user_id: userId, sanity_id: sanityId.trim() },
    { onConflict: "user_id,sanity_id", ignoreDuplicates: true }
  );
  if (error) {
    console.error("Supabase addSavedResource:", error);
    return false;
  }
  return true;
}

/** Remove a resource from user's saved list. Returns true on success. */
export async function removeSavedResource(userId: string, sanityId: string): Promise<boolean> {
  if (!supabaseAdmin || !isSupabaseConfigured() || !sanityId.trim()) return false;
  const { error } = await supabaseAdmin
    .from("user_saved_resources")
    .delete()
    .eq("user_id", userId)
    .eq("sanity_id", sanityId.trim());
  if (error) {
    console.error("Supabase removeSavedResource:", error);
    return false;
  }
  return true;
}
