"use client";

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Client-side Supabase client for Auth only (signInWithOtp, verifyOtp).
 * Uses the anon key; OTP emails are sent by Supabase (configure Resend SMTP in Supabase Dashboard).
 */
export const supabaseAuthClient =
  url && anonKey
    ? createClient(url, anonKey, {
        auth: { persistSession: false },
      })
    : null;

export function isSupabaseAuthConfigured(): boolean {
  return Boolean(url && anonKey);
}
