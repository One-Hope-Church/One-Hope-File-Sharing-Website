"use client";

import { useState } from "react";
import type { AppUser } from "@/lib/supabase-users";

interface AdminUsersListProps {
  initialUsers: AppUser[];
}

export default function AdminUsersList({ initialUsers }: AdminUsersListProps) {
  const [users, setUsers] = useState(initialUsers);
  const [updating, setUpdating] = useState<string | null>(null);

  async function toggleRole(user: AppUser) {
    const nextRole = user.role === "admin" ? "user" : "admin";
    setUpdating(user.email);
    try {
      const res = await fetch(
        `/api/admin/users/${encodeURIComponent(user.email)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role: nextRole }),
        }
      );
      if (!res.ok) throw new Error("Update failed");
      setUsers((prev) =>
        prev.map((u) =>
          u.email === user.email ? { ...u, role: nextRole } : u
        )
      );
    } catch {
      alert("Failed to update role");
    } finally {
      setUpdating(null);
    }
  }

  async function toggleBlocked(user: AppUser) {
    const nextBlocked = !user.blocked;
    setUpdating(user.email);
    try {
      const res = await fetch(
        `/api/admin/users/${encodeURIComponent(user.email)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ blocked: nextBlocked }),
        }
      );
      if (!res.ok) throw new Error("Update failed");
      setUsers((prev) =>
        prev.map((u) =>
          u.email === user.email ? { ...u, blocked: nextBlocked } : u
        )
      );
    } catch {
      alert("Failed to update user");
    } finally {
      setUpdating(null);
    }
  }

  if (users.length === 0) {
    return (
      <p className="mt-6 rounded-lg bg-onehope-info p-4 text-gray-600">
        No users yet. Users are added when they first sign in with email + OTP.
      </p>
    );
  }

  return (
    <div className="mt-6 overflow-hidden rounded-lg border border-onehope-gray">
      <table className="w-full text-left text-sm">
        <thead className="bg-onehope-info">
          <tr>
            <th className="px-4 py-3 font-semibold text-onehope-black">Email</th>
            <th className="px-4 py-3 font-semibold text-onehope-black">Role</th>
            <th className="px-4 py-3 font-semibold text-onehope-black">Status</th>
            <th className="px-4 py-3 font-semibold text-onehope-black">Joined</th>
            <th className="px-4 py-3 font-semibold text-onehope-black">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr
              key={user.id}
              className={`border-t border-onehope-gray ${user.blocked ? "bg-red-50" : ""}`}
            >
              <td className="px-4 py-3">{user.email}</td>
              <td className="px-4 py-3">
                <span
                  className={`rounded px-2 py-0.5 text-xs font-medium ${
                    user.role === "admin"
                      ? "bg-primary/20 text-primary"
                      : "bg-onehope-gray text-onehope-black"
                  }`}
                >
                  {user.role}
                </span>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`rounded px-2 py-0.5 text-xs font-medium ${
                    user.blocked
                      ? "bg-red-200 text-red-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {user.blocked ? "Blocked" : "Active"}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-600">
                {new Date(user.created_at).toLocaleDateString()}
              </td>
              <td className="px-4 py-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => toggleRole(user)}
                  disabled={updating === user.email}
                  className="rounded border border-primary px-3 py-1 text-primary hover:bg-primary hover:text-white disabled:opacity-50"
                >
                  {updating === user.email
                    ? "…"
                    : user.role === "admin"
                      ? "Set user"
                      : "Set admin"}
                </button>
                <button
                  type="button"
                  onClick={() => toggleBlocked(user)}
                  disabled={updating === user.email}
                  className={`rounded border px-3 py-1 disabled:opacity-50 ${
                    user.blocked
                      ? "border-green-600 text-green-700 hover:bg-green-600 hover:text-white"
                      : "border-red-600 text-red-700 hover:bg-red-600 hover:text-white"
                  }`}
                >
                  {updating === user.email ? "…" : user.blocked ? "Unblock" : "Block"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
