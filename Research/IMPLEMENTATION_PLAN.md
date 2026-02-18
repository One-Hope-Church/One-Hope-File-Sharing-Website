# One Hope File Sharing Website – Full Implementation Plan

This document outlines the **entire implementation** for the One Hope Resources (file-sharing) site. It ties together the **Research** (Highlands setup, S3, auth) and **Design** (layout, UI) into a phased build plan.

**Reference docs in this folder:**
- `HIGHLANDS_RESOURCES_RESEARCH.md` – How Highlands is built; file hosting; auth; content model.
- `RESOURCES_DESIGN_PLAN.md` – Layout, sidebar, home, collection page, cards, colors, responsive.

---

## 1. Scope and goals

| Goal | Description |
|------|-------------|
| **Staff upload** | Staff can upload files to S3 via an admin UI; metadata (collections, sections, resources) lives in Sanity. |
| **Viewer experience** | Authenticated **users** browse collections, view sections, and download files (single or “Download All” via presigned S3 URLs). |
| **Two login types** | **Users** and **Admins**. Both sign in with **email + one-time passcode (OTP)**. Only **admins** see the file upload button and can upload to S3; users do not. |
| **Email (OTP)** | Use **Resend** to send the one-time passcode emails. |
| **Design** | Match **One Hope website** branding and colors; layout similar to Highlands (dark sidebar, white main area, carousels, collection/resource cards). |
| **Storage** | **S3 only** for all file storage (no Sanity assets for resource files). Sanity holds structure and references only. |

---

## 2. Tech stack (decisions)

| Layer | Choice | Notes |
|--------|--------|------|
| **App** | Next.js (App Router) | Same as main One Hope site or standalone app; supports RSC, API routes, server actions. |
| **Auth** | NextAuth (or custom session) | **Email + one-time passcode** for everyone; session stores `role`: `user` or `admin`. |
| **Email (OTP)** | **Resend** | Send OTP emails (e.g. 6-digit code) to user's email; verify code on `/verify` then create session with role. |
| **Content & metadata** | **Sanity** | Collections, sections, resource metadata (title, description, S3 key/URL, order). No file binaries in Sanity. |
| **File storage** | **AWS S3** | All resource files (PDFs, videos, images, ZIPs). Presigned URLs for upload (staff) and download (viewers). |
| **Optional CDN** | CloudFront (or S3 public read) | For thumbnails/images if desired; or serve via app proxy. |

---

## 3. Content model (Sanity)

**Documents:**

- **resourceCollection**
  - `title`, `slug` (or id), `description`, `heroImage` (image or URL to S3 thumbnail), `featured` (bool), `category` (ref or string for nav), `sections` (array of refs or embedded section objects), `relatedCollections` (array of refs), `order` (number for “New”/featured ordering).

- **resourceSection** (or embedded in collection)
  - `title` (e.g. “Video Content”, “Service Flows”), `resources` (array of resource refs or embedded objects), `order`.

- **resource**
  - `title`, `description` (optional), `fileType` (video, pdf, image, etc.), `s3Key` (string: path in bucket, e.g. `collections/{id}/{filename}`), `thumbnailUrl` (optional; S3 or CDN URL), `order`.

**Categories** for sidebar can be a simple list (e.g. in a singleton “resourceSettings”) or tags on collections; filter collections by category for nav.

---

## 4. S3 structure

- **Bucket:** One dedicated bucket (e.g. `onehope-resources-prod`).
- **Paths:**
  - `collections/{collectionId}/{filename}` – single file.
  - `collections/{collectionId}/{resourceId}/{filename}` – if you prefer one folder per resource.
  - Thumbnails: `collections/{collectionId}/image.png` or `assets/{resourceId}/thumbnail.png` (optional; can also reference from Sanity or generate on upload).
- **Policies:** No public read; all access via **presigned URLs** (upload for staff, download for viewers). IAM user/role for the app with `s3:PutObject`, `s3:GetObject`, and optionally `s3:ListBucket` for admin.

---

## 5. Auth and access (users vs admins)

- **One login flow for everyone:** Email + **one-time passcode (OTP)**. No passwords.
  1. User enters email on `/signin` → backend generates 6-digit code, stores it (e.g. in DB or cache with short TTL), and sends it via **Resend**.
  2. User enters code on `/verify` → backend verifies code, looks up or creates account, assigns **role** (`user` or `admin`), creates session.
- **Users (`role: 'user'`):** Can browse collections, view sections, download files. **Do not** see any file upload button or admin UI.
- **Admins (`role: 'admin'`):** Same as users, plus they **see a file upload button** (e.g. in top bar or on collection/admin pages) that allows uploading files to S3. Only admins can call the presigned-upload API and create/update resources in Sanity.
- **Determining role:** Store admin emails in a list (env, DB, or Sanity). On verify, if email is in admin list → `role: 'admin'`, else → `role: 'user'`.
- **Invite (optional):** If you restrict access, only invited emails can sign in; invite flow can use Resend to send sign-up link or just add email to allowlist.

---

## 6. Phased implementation

### Phase 1 – Foundation (Sanity + S3 + app shell)

1. **Sanity**
   - Add schemas: `resourceCollection`, `resourceSection`, `resource` (and category/settings if needed).
   - Deploy studio; create a few test collections/sections/resources (with manual S3 key/URL for now).

2. **S3**
   - Create bucket; set CORS for browser uploads if using presigned PUT from front end.
   - IAM user/role for app with minimal permissions; store credentials in env (e.g. `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `S3_BUCKET_RESOURCES`).

3. **Next.js app (new or sub-app)**
   - Routes: `/`, `/signin`, `/verify`, `/collection/[id]`, `/myresources` (optional).
   - **Layout:** Implement two-column layout per Design doc (fixed dark sidebar, top bar with search + avatar + Invite placeholder).
   - **Home:** Static “Welcome” block + one “Featured” section that reads from Sanity (featured collections). Use placeholder cards if needed.
   - No auth yet: either show placeholder “Sign in” or allow public read for Phase 1.

**Exit criteria:** Sanity has resource data; S3 exists; app shows layout and at least one collection list/card from Sanity.

---

### Phase 2 – Auth and protected routes

1. **Auth (email + OTP via Resend)**
   - **Signin:** User enters email → `POST /api/auth/send-otp` → generate 6-digit code, store in DB/cache (e.g. 10 min TTL), send email via **Resend** with the code. Redirect to `/verify?email=...`.
   - **Verify:** User enters code → `POST /api/auth/verify-otp` → validate code, look up or create user, set role (`user` or `admin` from admin allowlist), create session cookie. Redirect to `callbackUrl` (e.g. `/`).
   - Protect `/`, `/collection/[id]`, `/myresources`: redirect to signin if no session.

2. **Session in layout**
   - Show user avatar and “Sign out” in top bar when logged in; “Sign in” when not.
   - **If `session.role === 'admin'`:** Show **Upload** (or “Upload file”) button in top bar or in a visible admin area. **If `session.role === 'user'`:** Do **not** show the upload button anywhere.
   - Optional: “My Resources” = bookmarked or recently viewed (stored per user in DB or cookies).

**Exit criteria:** User can sign in; home and collection pages require auth; avatar/sign out visible; only admins see Upload button.

---

### Phase 3 – Collection page and downloads

1. **Collection page**
   - Fetch collection by id/slug from Sanity (including sections and resources).
   - Render: title, description, hero image, **Download All** button, then sections with resource cards (title, thumbnail or icon, download button).

2. **Download (single file)**
   - API route (e.g. `GET /api/resources/download?key=...` or `POST /api/resources/download` with resource id). Server looks up S3 key from Sanity, generates presigned `getObject` URL (e.g. 10 min expiry), returns redirect or URL to client.
   - Resource card “Download” calls this or opens URL in new tab.

3. **Download All**
   - API route: given collection id, fetch all resources’ S3 keys from Sanity, create a ZIP on the fly (or pre-generate and store in S3). Return presigned URL to ZIP or stream. Alternative: return array of presigned URLs and let client download in sequence (simpler, no ZIP).

**Exit criteria:** Logged-in user can open a collection, see sections/resources, and download single files and “Download All”.

---

### Phase 4 – Staff upload (admin)

1. **Admin area**
   - Route: `/admin` (or `/admin/resources`) protected by role (e.g. check session.role === 'admin').
   - List collections from Sanity; “Add collection” / “Edit collection” (title, description, slug, category, hero image URL or upload).

2. **Upload flow**
   - **Option A (recommended for large files):** “Add resource” → pick collection + section → “Upload file” → call `POST /api/upload/presign` with filename and content-type. Server returns presigned PUT URL and final S3 key. Front end uploads file directly to S3 via `fetch(presignedUrl, { method: 'PUT', body: file })`. On success, call `POST /api/resources` (or Sanity client) to create/update resource document with `s3Key`, title, etc.
   - **Option B:** Front end sends file to Next.js API; API streams to S3. Simpler but uses server bandwidth and may hit body size limits for very large files.

3. **Sanity**
   - Staff can create collections/sections in Sanity and add resource metadata (title, s3Key) there; or your admin UI writes to Sanity via API when staff uploads. Prefer one source of truth (Sanity) for structure; admin UI can create/update Sanity documents.

**Exit criteria:** Staff can create a collection/section, upload a file to S3, and see the resource appear on the collection page with working download.

---

### Phase 5 – Home data and polish

1. **Home data from Sanity**
   - **Featured:** collections where `featured === true`, ordered.
   - **New Collections:** by `_createdAt` or `order`.
   - **Trending:** by view count (if you add analytics) or recent activity; else reuse “New”.
   - **Recently Viewed:** store in cookie or DB per user; show last N collection ids.

2. **Search**
   - Top bar search: query Sanity (or API that queries Sanity) by collection/resource title and description; show results as links to collections or resources.

3. **Invite (optional)**
   - “Invite” button → modal/form: enter email. Create invite record (DB or Sanity); send email with sign-up link if needed. Restrict sign-in to invited emails if desired.

4. **Design polish**
   - Carousels with prev/next; “Load More” on collection page for long sections; related collections at bottom. Match Design doc (colors, typography, hover states, mobile drawer).

**Exit criteria:** Home shows real Featured/New/Trending/Recently Viewed; search works; Invite optional; UI matches design plan.

---

## 7. API routes (summary)

| Route | Purpose |
|--------|--------|
| `POST /api/auth/...` | Handled by NextAuth (or your auth). |
| `GET /api/resources/download` or `POST` | Accept resource id (or S3 key); return presigned getObject URL or redirect. |
| `GET /api/resources/download-all` | Accept collection id; return presigned URL to ZIP or list of presigned URLs. |
| `POST /api/upload/presign` | Accept filename, content-type, collectionId, sectionId (optional). Return presigned PUT URL and S3 key. |
| `POST /api/resources` (optional) | Create/update resource in Sanity after upload (s3Key, title, etc.). |
| `GET /api/search?q=...` | Query Sanity for collections/resources; return list for search UI. |

---

## 8. Environment variables

- **Auth / session:** `SESSION_SECRET` (or `NEXTAUTH_SECRET` if using NextAuth), `NEXTAUTH_URL` if applicable.
- **Resend (OTP emails):** `RESEND_API_KEY`; from address/domain configured in Resend (e.g. `resources@onehopechurch.com` or your verified domain).
- **Admin list:** `ADMIN_EMAILS` (comma-separated) or a DB table / Sanity document listing admin emails so verify step can set `role: 'admin'`.
- **AWS S3:** `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `S3_BUCKET_RESOURCES`.
- **Sanity:** `SANITY_PROJECT_ID`, `SANITY_DATASET`, `SANITY_API_TOKEN` (for server-side writes when admins upload).

---

## 9. Testing and launch

- **Unit/integration:** Presign generation; Sanity queries; auth redirects.
- **E2E:** Sign in → open collection → download one file → download all (if ZIP).
- **Staff:** Upload a file → confirm it appears in collection and is downloadable.
- **Performance:** Large file upload (presigned) and download (presigned) without blocking server.
- **Launch:** Deploy app; point domain; restrict S3 bucket to app and presigned URLs only; enable auth and optional invite list.

---

## 10. Summary checklist

- [ ] Sanity schemas: resourceCollection, resourceSection, resource; categories/settings.
- [ ] S3 bucket + IAM; path convention; CORS if needed.
- [ ] Next.js app: layout (sidebar, top bar), home (welcome + carousels), collection page (sections, resource cards).
- [ ] Auth: email + OTP via Resend; signin → send OTP, verify → session with role (`user` or `admin`); protect routes; avatar/sign out.
- [ ] Role-based UI: only admins see Upload button; users do not. Guard upload API by role.
- [ ] Download: single-file presigned URL API; “Download All” (ZIP or multi-URL).
- [ ] Admin: admin-only upload UI and presigned upload API; create/update resource in Sanity after upload.
- [ ] Home: Featured/New/Trending/Recently Viewed from Sanity (and user data).
- [ ] Search and Invite (optional).
- [ ] Design polish and responsive (drawer nav, carousels, cards per Design doc).

Use **HIGHLANDS_RESOURCES_RESEARCH.md** for reference on Highlands behavior and S3/download patterns; use **RESOURCES_DESIGN_PLAN.md** for pixel-level layout and components. This **IMPLEMENTATION_PLAN.md** is the single place to track the full build from zero to launch.
