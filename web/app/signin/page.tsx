"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabaseAuthClient, isSupabaseAuthConfigured } from "@/lib/supabase-auth-client";

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!isSupabaseAuthConfigured() || !supabaseAuthClient) {
      setError("Sign-in is not configured. Add NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.");
      return;
    }
    setLoading(true);
    try {
      const { error: sbError } = await supabaseAuthClient.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/verify` : undefined,
        },
      });
      if (sbError) {
        setError(sbError.message || "Failed to send code");
        return;
      }
      router.push(`/verify?email=${encodeURIComponent(email.trim())}&callbackUrl=${encodeURIComponent(callbackUrl)}`);
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (!isSupabaseAuthConfigured()) {
    return (
      <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
        <h1 className="text-2xl font-bold text-onehope-black">Sign in</h1>
        <p className="mt-2 text-red-600">
          Sign-in is not configured. Set <code className="rounded bg-gray-100 px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in <code className="rounded bg-gray-100 px-1">web/.env</code> (get it from Supabase Dashboard → Project Settings → API → anon public).
        </p>
        <Link href="/" className="mt-4 inline-block text-primary hover:underline">Back to home</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-4 sm:px-6">
      <h1 className="text-2xl font-bold text-onehope-black">Sign in</h1>
      <p className="mt-2 text-gray-600">
        Enter your email and we’ll send you a one-time code.
      </p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-onehope-black">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="mt-1 w-full rounded-lg border border-onehope-gray px-4 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-primary py-2 font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
        >
          {loading ? "Sending…" : "Send code"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-600">
        <Link href="/" className="text-primary hover:underline">
          Back to home
        </Link>
      </p>
    </div>
  );
}
