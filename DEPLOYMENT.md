# Deploy One Hope Resources to Production

## Deploy to Vercel

1. **Push your code** to GitHub (or GitLab/Bitbucket).

2. **Import on Vercel**
   - Go to [vercel.com](https://vercel.com) → Add New Project
   - Import your repository
   - Set **Root Directory** to `web` (the Next.js app lives in `web/`)
   - Framework Preset: Next.js (auto-detected)

3. **Add environment variables** in Vercel → Project Settings → Environment Variables. Use **Production** (and Preview if desired). Add:

   | Variable | Required | Notes |
   |----------|----------|-------|
   | `SESSION_SECRET` | Yes | Min 32 chars; use a long random string for production |
   | `NEXT_PUBLIC_SUPABASE_URL` | Yes | From Supabase Dashboard → Project Settings → API |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Same as above |
   | `SUPABASE_SERVICE_ROLE_KEY` | Yes | For admin user lookup (keep secret) |
   | `ADMIN_EMAILS` | Yes | Comma-separated admin emails (fallback when Supabase not configured) |
   | `NEXT_PUBLIC_SANITY_PROJECT_ID` | Yes | From Sanity project |
   | `NEXT_PUBLIC_SANITY_DATASET` | Yes | Usually `production` |
   | `SANITY_PROJECT_ID` | Yes | Same as above |
   | `SANITY_DATASET` | Yes | Same as above |
   | `SANITY_API_TOKEN` | Yes | From Sanity → API → Tokens (needs Editor access) |
   | `AWS_ACCESS_KEY_ID` | Yes | For S3 upload/download |
   | `AWS_SECRET_ACCESS_KEY` | Yes | Same |
   | `AWS_REGION` | Yes | e.g. `us-east-1` |
   | `S3_BUCKET_RESOURCES` | Yes | Your S3 bucket name |

4. **Deploy** – Vercel will build and deploy. Your site will be live at `your-project.vercel.app`.

5. **Custom domain** (optional) – In Vercel → Project Settings → Domains, add your domain (e.g. `resources.onehopechurch.com`) and follow DNS instructions.

## Troubleshooting: 404 NOT_FOUND

If you see `404: NOT_FOUND` after deploying:

1. **Set Root Directory** – Vercel → Project Settings → General → Root Directory → enter `web` → Save. Then redeploy.
2. **Check build logs** – Deployments → click the deployment → Building. Ensure the build completes successfully.
3. **Env vars** – Missing required env vars can cause build failures. Add all variables from the table above.

## Pre-deploy checklist

- [ ] All env vars set in Vercel (copy from `web/.env` but use production values)
- [ ] `SESSION_SECRET` is a fresh random string (not the dev value)
- [ ] Supabase migrations run on your production Supabase project
- [ ] S3 bucket CORS and policy allow your Vercel domain
- [ ] Sanity CORS allows your production domain (Sanity Dashboard → API → CORS origins)
- [ ] Supabase Auth → URL Configuration: add your production site URL and redirect URLs
