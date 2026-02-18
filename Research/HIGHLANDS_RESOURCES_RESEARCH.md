# Highlands Resources (resources.churchofthehighlands.com) – Setup Research

Summary of how the Church of the Highlands file-sharing site appears to be built, based on inspecting the live app while logged in.

---

## 1. Tech stack

| Layer | Technology |
|--------|------------|
| **Frontend / framework** | **Next.js** (App Router) – `_next/static/chunks`, `main-app-*.js`, `app/layout-*.js`, and `?_rsc=` on navigations |
| **Auth** | **NextAuth-style** – email + one-time code (no password). Endpoints: `/api/auth/session`, `/api/auth/providers`, `/api/auth/csrf`, `/api/auth/callback/credentials` |
| **Data loading** | React Server Components (RSC) – GET/POST to same-origin routes with `_rsc`; no separate public REST/GraphQL API for file listing |
| **Analytics** | Google Analytics (GTag) |

Auth flow: enter email → receive 6-digit code → verify at `/verify?email=...&method=code&callbackUrl=...` → redirect to home. Session is then used for authenticated RSC requests.

---

## 2. URL and information architecture

- **`/`** – Home (featured, new, trending, recently viewed)
- **`/signin`** – Email sign-in (with `callbackUrl`)
- **`/verify`** – OTP entry (email, method=code, callbackUrl)
- **`/collection/{uuid}`** – Single collection (e.g. `2e98e224-572b-4e61-9e4f-96508141567a`)
- **`/section/{uuid}`** – Section (seen in network; likely used for nav or sub-views)
- **`/myorganization`** – "My Organization"
- **`/myresources`** – "My Resources"

Collections and sections use **UUIDs** in the path. No human-readable slugs in the URLs observed.

---

## 3. Home page layout (logged in)

- **Top bar:** Logo, collapsible sidebar toggle, search ("What can I help you find?"), user avatar, **Invite** button.
- **Sidebar (nav):**
  - **Primary:** Home, My Organization, My Resources.
  - **Categories (hash `#` links, likely client-side):** Prayer, Message Series, Students, Discipleship, Event Logistics, Outreach, Leadership, Worship, Kids Series.
  - **Footer links:** About (churchofthehighlands.com), Contact Us (mailto:resources@…), Privacy Policy.
- **Main content:**
  - Hero: "Welcome to Highlands Resources" + short description.
  - **Featured Resources** – horizontal carousel of collection cards.
  - **Explore Highlands College** – CTA to highlandscollege.edu.
  - **New Collections** – carousel of collection cards.
  - **Trending** – carousel of collection cards.
  - **Recently Viewed** – carousel of collection cards.

Each card: image, title, category/tags, short description, link to `/collection/{uuid}`.

---

## 4. Collection page (file-sharing UX)

- **Header:** Title, short description, hero image.
- **Actions:** Bookmark Collection, Remove Implementation, **Download All**.
- **Body:** Grouped into **sections** (e.g. "Series Overview & Art", "Video Content", "Small Group Leader Guides", "Service Flows", "Series Socials").
- **Section contents:** Cards or rows of **resources** (e.g. "Love Series Overview", "Series Art", video lessons). Each item has:
  - Thumbnail (or video thumbnail).
  - Title.
  - Buttons (likely download / open / preview).
- **Video Content** included a "Load More" for pagination.
- **Related Resources** at bottom – links to other collections.

So the model is: **Collection → Sections → Resources (files/links)**. No visible "folder" tree; it's section-based.

---

## 5. Data and API pattern

- **No dedicated file API in the network log.** Listings and metadata appear to come from the same Next.js app via:
  - GET `/?_rsc=...` and GET `/collection/{id}?_rsc=...`
  - POST `/` and POST to collection URLs (RSC payloads).
- **Auth:** Session cookie; `GET /api/auth/session` returns session; login goes through `/api/auth/callback/credentials`.
- **Implication:** File and collection data are likely loaded **server-side** (DB + file storage), with download/preview URLs either rendered by the server or obtained via server actions/API routes. No public REST or GraphQL file API was observed.

---

## 6. Content model (inferred)

- **Collection** – Top-level resource pack (e.g. a series or topic). Has: UUID, title, description, image, sections.
- **Section** – Grouping inside a collection (e.g. "Video Content", "Service Flows"). Has: heading, list of resources.
- **Resource** – Single file or link. Has: title, thumbnail, type (e.g. video vs document), and actions (download/preview).

Categories in the nav (Prayer, Message Series, Students, etc.) likely filter or tag collections rather than being a separate hierarchy.

---

## 7. How you could replicate something similar

1. **Next.js App Router** – Same domain for app and "API" (RSC + route handlers).
2. **Auth** – NextAuth (or similar) with **Credentials** or **Email** provider (magic link or OTP like Highlands).
3. **Database** – Store users, collections, sections, and resource metadata (title, type, storage key/URL, order).
4. **File storage** – S3, Cloudflare R2, or Vercel Blob; store files keyed by collection/section/resource. Serve via:
   - Signed URLs from an API route or server action, or
   - Next.js route that proxies to storage.
5. **UI** – Home with featured/trending/recent (query DB by flags or activity); collection page with sections and resource cards; "Download All" as a zip or multi-link generated server-side.
6. **Invite** – Optional: invite-by-email table and logic tied to your auth (e.g. allowlist or invite codes).

If you want, next step can be a minimal One Hope "resources" spec (routes, DB schema, and storage layout) that mirrors this structure.

---

## 8. How files are hosted (downloads)

Observed when clicking **Download All** on a collection:

- **Zip download:** The browser is sent to a **presigned AWS S3 URL**, e.g.  
  `https://resources-api-prod.s3.us-east-1.amazonaws.com/collections/{collectionId}/{collectionId}.zip`  
  with query params: `X-Amz-Algorithm`, `X-Amz-Credential`, `X-Amz-Date`, `X-Amz-Expires=36000` (10 hours), `X-Amz-Security-Token`, `X-Amz-Signature`, etc.
- **Flow:** The Next.js app (server) generates a **short-lived presigned S3 URL**; the client then downloads the file **directly from S3**. No proxy through the app.
- **Bucket:** `resources-api-prod`, region `us-east-1`. Path pattern for "Download All": `collections/{collectionId}/{collectionId}.zip`.
- **Images/thumbnails:** Served from **resources.highlandscdn.com** (e.g. `collections/{id}/image.png`, `assets/{uuid}/thumbnail.png`). That's likely CloudFront (or similar) in front of the same S3 bucket or a dedicated assets bucket.

So: **files live in S3; downloads use time-limited presigned URLs; images go through their CDN.**

---

## 9. Can other people upload their own files?

- **Highlands' site:** There is **no public upload**. Only admins (their team) can add collections and files. End users only sign in, browse, and download. There is no "Upload" or "Add resource" in the main UI; the **Invite** button is for inviting other viewers, not contributors.
- **If you build something similar for One Hope:**
  - **Same model (admin-only upload):** Easy. Add an **admin area** (or use Sanity/another CMS) where staff create collections/sections and upload files. Files go to your own S3 (or R2/Blob); the app generates presigned URLs for download, same pattern as above.
  - **Let "other people" (e.g. partner churches) upload:** Doable but more work. You'd need: roles/permissions (who can upload to which collection), upload UI, validation (file type/size), and possibly moderation. So: **hosting and download are straightforward; who can upload is a product/UX choice** (admin-only vs. broader upload with roles).
