import { listUsers } from "@/lib/supabase-users";
import { isSupabaseConfigured } from "@/lib/supabase-users";
import AdminUsersList from "./AdminUsersList";

export default async function AdminUsersPage() {
  const configured = isSupabaseConfigured();
  const users = configured ? await listUsers() : [];

  return (
    <div>
      <h1 className="text-2xl font-bold text-onehope-black">Users</h1>
      <p className="mt-2 text-gray-600">
        Toggle any user between <strong>user</strong> and <strong>admin</strong>. Admins can upload files and manage users.
      </p>
      {!configured ? (
        <p className="mt-6 rounded-lg bg-amber-100 p-4 text-amber-800">
          Supabase is not configured. Set <code className="rounded bg-amber-200 px-1">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code className="rounded bg-amber-200 px-1">SUPABASE_SERVICE_ROLE_KEY</code> and run the users table migration.
        </p>
      ) : (
        <AdminUsersList initialUsers={users} />
      )}
    </div>
  );
}
