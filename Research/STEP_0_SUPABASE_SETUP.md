# Step 0: Supabase setup (step-by-step)

This is the **user database** for One Hope Resources. Sign-up stays the same (email + OTP); we just store users here and read their role (user vs admin) from the database so you can toggle them later.

---

## Why does Supabase ask for a database password?

When you **create a new Supabase project**, Supabase provisions a **PostgreSQL database** for you. They require you to set a **database password** for that Postgres instance. That password is for:

- The underlying **PostgreSQL** database (direct SQL access, backups, Supabase’s own tools).
- **Not** for your Next.js app.

**Your Next.js app never uses the database password.** It only uses:

- **Project URL** (e.g. `https://xxxx.supabase.co`)
- **service_role key** (from **Settings → API**)

So: set a strong database password when creating the project and **store it somewhere safe** (e.g. password manager). You’ll need it only if you ever connect to the database directly (e.g. with a SQL client or Supabase’s “Database” settings). For the Resources app you only need the URL and the **service_role** key.

---

## Step-by-step

### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and sign in (or create an account).
2. Click **New project**.
3. Choose your **Organization** and a **Name** (e.g. `onehope-resources`).
4. Set a **Database password**.
   - Supabase requires this for the Postgres database.
   - Use a strong password and save it (e.g. in your password manager).
   - You won’t put this in `.env` for the app.
5. Pick a **Region** (closest to you or your users).
6. Click **Create new project** and wait until the project is ready.

---

### 2. Create the `users` table

1. In the left sidebar, open **SQL Editor**.
2. Click **New query**.
3. Paste the contents of **`web/supabase/migrations/001_users_table.sql`** (from this repo).
4. Click **Run** (or press Cmd/Ctrl + Enter).
5. You should see “Success.” The `public.users` table now exists.

---

### 3. Get the values for your app

1. In the left sidebar, go to **Settings** (gear icon) → **API**.
2. Under **Project URL**, click **Copy** → this is `NEXT_PUBLIC_SUPABASE_URL`.
3. Under **Project API keys**, find **service_role** (not anon).
   - Click **Reveal** and then **Copy**.
   - This is `SUPABASE_SERVICE_ROLE_KEY`.
   - Keep this secret; only use it on the server (never in browser code).

---

### 4. Add them to `.env.local`

1. In the `web` folder, copy the example env file:
   ```bash
   cp .env.example .env.local
   ```
2. Open `web/.env.local` and set:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...your-service-role-key
   ```

   (Use the **Project URL** and **service_role** key from step 3. Do **not** put the database password here.)

3. Save the file.

---

### 5. (Optional) First admin

- Put **your** email in `ADMIN_EMAILS` in `.env.local`, e.g.:
  ```env
  ADMIN_EMAILS=you@onehopechurch.com
  ```
- The **first time** you sign in with that email (email + OTP), you’ll be created in Supabase with `role: admin`.
- After that, open **Admin → Users** in the app to toggle any other user between user and admin.

---

### 6. Run the app

```bash
cd web
npm run dev
```

Sign in with email + OTP. If Supabase is configured and the migration was run, you’ll be in the `users` table and your role will come from the database. If you set `ADMIN_EMAILS` to your email, you’ll be an admin and can use **Admin → Users** to change others.

---

## Quick reference

| Thing                | Where it’s used                         | In `.env.local`?        |
|----------------------|----------------------------------------|--------------------------|
| Database password    | Supabase/Postgres only (direct access) | **No**                   |
| Project URL          | Next.js app (Supabase client)           | **Yes** → `NEXT_PUBLIC_SUPABASE_URL` |
| service_role key     | Next.js app (server-only)              | **Yes** → `SUPABASE_SERVICE_ROLE_KEY` |

If you hit a step that doesn’t match your screen (e.g. Supabase changed their UI), say which step and what you see and we can adjust.
