"use client";

import { useState, useEffect } from "react";

interface ProfileModalProps {
  userEmail: string;
  onComplete: () => void;
}

export default function ProfileModal({ userEmail, onComplete }: ProfileModalProps) {
  const [visible, setVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    church_name: "",
    church_city: "",
    church_state: "",
  });

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setVisible(false);
    };
    if (visible) {
      window.addEventListener("keydown", onKeyDown);
      return () => window.removeEventListener("keydown", onKeyDown);
    }
  }, [visible]);

  useEffect(() => {
    let mounted = true;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch("/api/profile", { credentials: "same-origin" });
        const data = await res.json().catch(() => ({}));
        if (mounted && !data.complete && data.profile) {
          setForm({
            first_name: data.profile.first_name ?? "",
            last_name: data.profile.last_name ?? "",
            phone: data.profile.phone ?? "",
            church_name: data.profile.church_name ?? "",
            church_city: data.profile.church_city ?? "",
            church_state: data.profile.church_state ?? "",
          });
        }
        if (mounted && !data.complete) {
          setNeedsProfile(true);
          setVisible(true);
        }
      } catch {
        if (mounted) setVisible(false);
      }
    }, 4000);
    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [userEmail]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setVisible(false);
        onComplete();
      }
    } finally {
      setSaving(false);
    }
  }

  if (!needsProfile || !visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
      onClick={() => setVisible(false)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
    >
      <div
        className="w-full max-w-lg animate-slide-up rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-onehope-gray px-6 py-4">
          <h2 id="profile-modal-title" className="text-xl font-bold text-onehope-black">
            Complete your profile
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Help us personalize your experience with a few quick questions.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="first_name" className="block text-sm font-medium text-onehope-black">
                First Name *
              </label>
              <input
                id="first_name"
                type="text"
                value={form.first_name}
                onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
                required
                className="mt-1 w-full rounded-lg border border-onehope-gray px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label htmlFor="last_name" className="block text-sm font-medium text-onehope-black">
                Last Name *
              </label>
              <input
                id="last_name"
                type="text"
                value={form.last_name}
                onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
                required
                className="mt-1 w-full rounded-lg border border-onehope-gray px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-onehope-black">
              Phone Number
            </label>
            <input
              id="phone"
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-onehope-gray px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label htmlFor="church_name" className="block text-sm font-medium text-onehope-black">
              Church Name
            </label>
            <input
              id="church_name"
              type="text"
              value={form.church_name}
              onChange={(e) => setForm((f) => ({ ...f, church_name: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-onehope-gray px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="church_city" className="block text-sm font-medium text-onehope-black">
                Church City
              </label>
              <input
                id="church_city"
                type="text"
                value={form.church_city}
                onChange={(e) => setForm((f) => ({ ...f, church_city: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-onehope-gray px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label htmlFor="church_state" className="block text-sm font-medium text-onehope-black">
                Church State
              </label>
              <input
                id="church_state"
                type="text"
                value={form.church_state}
                onChange={(e) => setForm((f) => ({ ...f, church_state: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-onehope-gray px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setVisible(false)}
              className="rounded-lg border border-onehope-gray px-4 py-2 text-sm font-medium text-onehope-black hover:bg-onehope-gray/30"
            >
              Later
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-dark disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
