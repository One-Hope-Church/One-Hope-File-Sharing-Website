"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabaseAuthClient, isSupabaseAuthConfigured } from "@/lib/supabase-auth-client";

export default function VerifyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!isSupabaseAuthConfigured() || !supabaseAuthClient) {
      setError("Sign-in is not configured.");
      return;
    }
    setLoading(true);
    try {
      const { data, error: sbError } = await supabaseAuthClient.auth.verifyOtp({
        email: email.trim(),
        token: code.trim(),
        type: "email",
      });
      if (sbError) {
        setError(sbError.message || "Invalid or expired code");
        return;
      }
      const accessToken = data?.session?.access_token;
      if (!accessToken) {
        setError("Could not complete sign in");
        return;
      }
      const res = await fetch("/api/auth/supabase-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token: accessToken }),
      });
      const sessionData = await res.json();
      if (!res.ok) {
        setError(sessionData.error || "Could not complete sign in");
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (!email) {
    return (
      <div className="mx-auto max-w-md px-6 py-12 text-center">
        <p className="text-gray-600">Missing email. Please start from sign in.</p>
        <Link href="/signin" className="mt-4 inline-block text-primary hover:underline">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-6">
      <h1 className="text-2xl font-bold text-onehope-black">Enter your code</h1>
      <p className="mt-2 text-gray-600">
        We sent a 6-digit code to <strong>{email}</strong>. Enter it below.
      </p>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="code" className="block text-sm font-medium text-onehope-black">
            Code
          </label>
          <input
            id="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            maxLength={6}
            required
            className="mt-1 w-full rounded-lg border border-onehope-gray px-4 py-2 text-center text-lg tracking-widest focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}
        <button
          type="submit"
          disabled={loading || code.length !== 6}
          className="w-full rounded-lg bg-primary py-2 font-semibold text-white hover:bg-primary-dark disabled:opacity-50"
        >
          {loading ? "Verifying…" : "Verify"}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-gray-600">
        <Link href="/signin" className="text-primary hover:underline">
          Use a different email
        </Link>
      </p>
    </div>
  );
}
