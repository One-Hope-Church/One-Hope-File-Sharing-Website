import { supabaseAdmin, isSupabaseConfigured } from "./supabase-server";
import { getUserByEmail } from "./supabase-users";

/** Log a download for a user. Call after successful presign, before redirect. */
export async function logDownload(email: string, sanityId: string): Promise<void> {
  if (!supabaseAdmin || !isSupabaseConfigured() || !sanityId.trim()) return;
  const user = await getUserByEmail(email);
  if (!user) return;
  await supabaseAdmin.from("user_download_log").insert({
    user_id: user.id,
    sanity_id: sanityId.trim(),
  });
}

/** Get recent download sanity_ids for a user (most recent first, deduped, limit 12). */
export async function getRecentDownloadIdsForUser(email: string): Promise<string[]> {
  if (!supabaseAdmin || !isSupabaseConfigured()) return [];
  const user = await getUserByEmail(email);
  if (!user) return [];
  const { data, error } = await supabaseAdmin
    .from("user_download_log")
    .select("sanity_id")
    .eq("user_id", user.id)
    .order("downloaded_at", { ascending: false })
    .limit(50);
  if (error) {
    console.error("Supabase getRecentDownloadIds:", error);
    return [];
  }
  const seen = new Set<string>();
  const result: string[] = [];
  for (const row of data ?? []) {
    const id = row.sanity_id;
    if (id && !seen.has(id)) {
      seen.add(id);
      result.push(id);
      if (result.length >= 12) break;
    }
  }
  return result;
}
