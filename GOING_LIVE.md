# Going live – One Hope File Sharing Website

Checklist to deploy the app to production and point users at it.

---

## 1. Choose where to deploy the Next.js app

The app lives in **`web/`**. Common options:

- **Vercel** (recommended for Next.js): Connect the repo, set **Root Directory** to `web`, then add env vars (step 3).
- **Other host** (Netlify, Railway, your server): Build with `cd web && npm run build`, run `npm run start`. Set env vars in the host’s dashboard or `.env.production`.

---

## 2. Production environment variables

Set these in your hosting dashboard (e.g. Vercel → Project → Settings → Environment Variables). Use **Production** (and optionally Preview if you use branches).

| Variable | Required | Notes |
|----------|----------|--------|
| `SESSION_SECRET` | Yes | Long random string (32+ chars). Generate with `openssl rand -base64 32`. |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL (Dashboard → Settings → API). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key (same page). |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service role key (for session/role lookup). Keep secret. |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Yes | Sanity project ID (e.g. from `web/.env.example`). |
| `NEXT_PUBLIC_SANITY_DATASET` | Yes | Usually `production`. |
| `SANITY_PROJECT_ID` | Yes | Same as `NEXT_PUBLIC_SANITY_PROJECT_ID`. |
| `SANITY_DATASET` | Yes | Same as `NEXT_PUBLIC_SANITY_DATASET`. |
| `SANITY_API_TOKEN` | Yes | Sanity API token with Editor (or higher) so uploads and collection creation work. |
| `AWS_ACCESS_KEY_ID` | Yes | IAM user key for S3 (see `Research/S3_BUCKET_SETUP.md`). |
| `AWS_SECRET_ACCESS_KEY` | Yes | IAM secret. |
| `AWS_REGION` | Yes | e.g. `us-east-1`. |
| `S3_BUCKET_RESOURCES` | Yes | Bucket name (e.g. `onehope-resources-prod`). |
| `ADMIN_EMAILS` | No | Fallback admin list if Supabase isn’t used; comma-separated. |

**Important:** Do **not** commit real secrets to git. Use the host’s env UI or a secrets manager.

---

## 3. Supabase – production auth

1. **Supabase Dashboard** → your project → **Authentication** → **URL Configuration**.
2. Set **Site URL** to your production URL (e.g. `https://resources.onehopechurch.com`).
3. Add **Redirect URLs**: your production origin (e.g. `https://resources.onehopechurch.com/**`) so OTP callback and sign-in redirects work.
4. If you use custom email (Auth → SMTP), ensure it’s configured and tested.

---

## 4. S3 bucket – CORS for production

1. **AWS S3** → your bucket (e.g. `onehope-resources-prod`) → **Permissions** → **CORS**.
2. Add your **production origin** to `AllowedOrigins`, e.g.:
   - `https://resources.onehopechurch.com`
   - Or your Vercel URL: `https://your-project.vercel.app`
3. Keep `PUT`, `GET`, `HEAD` and `ExposeHeaders: ["ETag"]` as in `Research/S3_BUCKET_SETUP.md`.

---

## 5. Sanity Studio

- Studio is already deployed at **https://onehope-resources.sanity.studio** (or your host).
- No extra step for “going live” unless you want a custom studio URL; content is shared with the Next.js app via project ID and dataset.

---

## 6. Deploy and build

- **Vercel:** Push to the connected branch; deploy runs automatically. Ensure **Root Directory** is `web`.
- **Manual:** From repo root, run:
  ```bash
  cd web
  npm ci
  npm run build
  npm run start
  ```
- Fix any build errors (missing env vars often show up here).

---

## 7. Custom domain (optional)

- **Vercel:** Project → Settings → Domains → add your domain (e.g. `resources.onehopechurch.com`) and follow DNS instructions.
- **Other host:** Point your DNS A/CNAME record to the host, then set the domain in the host’s dashboard.
- After the domain is live, update **Supabase redirect URLs** and **S3 CORS** to use that domain (steps 3 and 4).

---

## 8. Post-launch checks

- [ ] **Sign-in:** Open production URL → Sign in → enter email → get OTP → verify → land on home.
- [ ] **Sections:** Sidebar sections open section pages (e.g. Kids); collections and standalone resources show as expected.
- [ ] **Collections:** Open a collection; resources and cover image load; download works.
- [ ] **Search:** Search returns collections and only standalone resources (no duplicates from inside collections).
- [ ] **Admin:** Sign in as admin → Upload (single and “New collection”), Collection cover, Users; uploads and collection creation succeed.
- [ ] **Download:** Click Download on a resource; file downloads via presigned URL.

---

## Summary

| Step | Action |
|------|--------|
| 1 | Choose host; set root to `web` if using Vercel. |
| 2 | Set all production env vars (session, Supabase, Sanity, AWS). |
| 3 | Configure Supabase Site URL and Redirect URLs for production. |
| 4 | Add production origin to S3 bucket CORS. |
| 5 | Sanity already in use; no change needed unless you move studio. |
| 6 | Deploy and confirm build succeeds. |
| 7 | (Optional) Add custom domain and update Supabase + S3. |
| 8 | Run post-launch checks. |

For S3 bucket creation and IAM, see **`Research/S3_BUCKET_SETUP.md`**.
