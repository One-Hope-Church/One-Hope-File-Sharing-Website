# One Hope File Sharing Website

Resources site for One Hope Church: authenticated users browse collections and download files; admins can upload files to S3.

## Stack

- **Next.js 14** (App Router)
- **Auth:** Email + one-time passcode (OTP) via [Resend](https://resend.com). Roles: `user` (browse/download) and `admin` (upload).
- **Content:** [Sanity](https://sanity.io) for collections, sections, and resource metadata.
- **Files:** AWS S3 with presigned URLs for upload (admin) and download (all logged-in users).
- **Styling:** Tailwind; branding matches One Hope website (primary `#0092cc`, Avenir/Helvetica).

## Setup

1. **Install and run (app lives in `web/`):**
   ```bash
   cd web
   npm install
   cp .env.example .env.local
   # Edit .env.local with your keys
   npm run dev
   ```
2. Open [http://localhost:3000](http://localhost:3000).

## Environment variables

See `web/.env.example`. Required for full functionality:

- `SESSION_SECRET` – session encryption (min 32 chars).
- `RESEND_API_KEY` – send OTP emails (dev: optional; code is logged if unset).
- `ADMIN_EMAILS` – comma-separated admin emails.
- `NEXT_PUBLIC_SANITY_*` / `SANITY_*` – Sanity project and optional token.
- `AWS_*` / `S3_BUCKET_RESOURCES` – S3 bucket for uploads and downloads.

## Sanity schema

You need document types: `resourceCollection` (title, slug, description, heroImage, featured, category, sections), `resourceSection` (title, resources[], order), `resource` (title, description, fileType, s3Key, thumbnailUrl, order). See `Research/IMPLEMENTATION_PLAN.md` for the full content model.

## Routes

- `/` – Home (featured collections when logged in).
- `/signin` – Enter email → OTP sent via Resend.
- `/verify` – Enter 6-digit code → session with role.
- `/collection/[slug]` – Collection detail and resource downloads.
- `/myresources` – Placeholder for bookmarks / recently viewed.
- `/admin` – Upload file to S3 (admin only).

## Research

- `Research/IMPLEMENTATION_PLAN.md` – Full build plan and API summary.
- `Research/RESOURCES_DESIGN_PLAN.md` – Layout and One Hope branding.
- `Research/HIGHLANDS_RESOURCES_RESEARCH.md` – Reference and patterns.
