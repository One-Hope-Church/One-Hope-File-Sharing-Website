"use client";

import { useState, useEffect } from "react";

const US_STATES = [
  { value: "", label: "Select state" },
  { value: "AL", label: "Alabama" },
  { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" },
  { value: "DE", label: "Delaware" },
  { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" },
  { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" },
  { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" },
  { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" },
  { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" },
  { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" },
  { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" },
  { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" },
  { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" },
  { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" },
  { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" },
  { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" },
  { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" },
  { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" },
  { value: "WY", label: "Wyoming" },
  { value: "DC", label: "District of Columbia" },
];

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits.replace(/(\d{0,3})/, "($1");
  if (digits.length <= 6) return digits.replace(/(\d{3})(\d{0,3})/, "($1) $2");
  return digits.replace(/(\d{3})(\d{3})(\d{0,4})/, "($1) $2-$3");
}

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
    church_title: "",
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
          const rawPhone = (data.profile.phone ?? "").toString();
          setForm({
            first_name: data.profile.first_name ?? "",
            last_name: data.profile.last_name ?? "",
            phone: rawPhone ? formatPhone(rawPhone) : "",
            church_name: data.profile.church_name ?? "",
            church_title: data.profile.church_title ?? "",
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

  const ReqLabel = ({ id, children }: { id: string; children: React.ReactNode }) => (
    <label htmlFor={id} className="block text-sm font-medium text-onehope-black">
      {children} <span className="text-red-600" aria-hidden>*</span>
    </label>
  );

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
              <ReqLabel id="first_name">First Name</ReqLabel>
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
              <ReqLabel id="last_name">Last Name</ReqLabel>
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
            <ReqLabel id="phone">Phone Number</ReqLabel>
            <input
              id="phone"
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: formatPhone(e.target.value) }))}
              placeholder="(555) 123-4567"
              required
              className="mt-1 w-full rounded-lg border border-onehope-gray px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <ReqLabel id="church_name">Church Name</ReqLabel>
            <input
              id="church_name"
              type="text"
              value={form.church_name}
              onChange={(e) => setForm((f) => ({ ...f, church_name: e.target.value }))}
              required
              className="mt-1 w-full rounded-lg border border-onehope-gray px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <ReqLabel id="church_title">Title / Position</ReqLabel>
            <input
              id="church_title"
              type="text"
              value={form.church_title}
              onChange={(e) => setForm((f) => ({ ...f, church_title: e.target.value }))}
              placeholder="e.g. Pastor, Worship Leader, Youth Director"
              required
              className="mt-1 w-full rounded-lg border border-onehope-gray px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <ReqLabel id="church_city">Church City</ReqLabel>
              <input
                id="church_city"
                type="text"
                value={form.church_city}
                onChange={(e) => setForm((f) => ({ ...f, church_city: e.target.value }))}
                required
                className="mt-1 w-full rounded-lg border border-onehope-gray px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <ReqLabel id="church_state">Church State</ReqLabel>
              <select
                id="church_state"
                value={form.church_state}
                onChange={(e) => setForm((f) => ({ ...f, church_state: e.target.value }))}
                required
                className="mt-1 w-full rounded-lg border border-onehope-gray px-3 py-2 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {US_STATES.map((s) => (
                  <option key={s.value || "empty"} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
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
