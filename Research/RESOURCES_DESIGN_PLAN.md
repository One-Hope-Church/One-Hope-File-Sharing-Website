# One Hope Resources – Layout & Design Plan (Highlands-style)

This document describes how to make the One Hope Resources site **look and behave like** Church of the Highlands Resources, so staff and users get a familiar, clean experience. Use it alongside `HIGHLANDS_RESOURCES_RESEARCH.md` (structure, auth, S3).

---

## 1. Overall layout

**Two-column layout:**

| Area | Width (approx) | Role |
|------|----------------|------|
| **Left sidebar** | Fixed ~280–320px | Navigation: logo, primary links, categories, footer links. Dark background. |
| **Right content** | Fluid (remainder) | Top bar (search, user, Invite) + scrollable main content (white). |

- Sidebar is **fixed** (does not scroll with content).
- Main area has its own **vertical scroll**.
- On small viewports: sidebar collapses to a **hamburger/drawer**; top bar and main content stay full width.

---

## 2. Left sidebar

**Background:** Dark charcoal / near-black (e.g. `#1d252d` or `#212121`). Not pure black.

**Structure (top to bottom):**

1. **Logo row**
   - Logo (wordmark or logo + "One Hope Resources").
   - Right: **collapse/expand** button (optional) to hide sidebar to icons-only or show full labels.

2. **Primary nav** (with icons)
   - **Home** (house icon) → `/`
   - **My Organization** (building icon) → `/myorganization` (optional for One Hope)
   - **My Resources** (grid icon) → `/myresources` (bookmarks / "my" list)

3. **Separator** (thin line or spacing)

4. **Category nav** (with icons + chevron/arrow)
   - Each item: icon + label + right arrow (expand or link).
   - Examples for One Hope: Kids, Students, Worship, Production, Message Series, Discipleship, etc.  
   - Can be links to filtered views or expandable sections; match your Sanity categories.

5. **Separator**

6. **Footer links** (with icons)
   - About (info icon) → your main site or resources about page
   - Contact Us (mail/chat icon) → mailto or contact page
   - Privacy Policy (doc icon) → policy URL

**Typography (sidebar):**
- Nav links: ~16px, color `rgb(152, 165, 175)` (light gray). Active/hover: white or light blue background + dark text.
- Icons: same color as text; simple, consistent stroke style (e.g. 24×24).

**Interaction:**
- Hover: slight background or color change.
- Active route: distinct background (e.g. light blue `#e3f2fd`) and dark text so current section is obvious.

---

## 3. Top bar (above main content)

**Background:** White. Bottom border or subtle shadow to separate from content.

**Contents (left to right):**

- **Search** (center or left-of-center)
  - Rounded full-width or wide input.
  - Placeholder: e.g. "What can I help you find?"
  - Magnifying glass icon inside or left of field.
  - Search runs on collection/resource titles and metadata (and optionally file names).

- **Right side**
  - **User avatar** (circle, links to profile/settings).
  - **Invite** button: primary or outline style (e.g. blue border, white fill). Opens invite flow (email) for new viewers.

**Height:** ~56–64px so it feels like a clear "chrome" bar.

---

## 4. Home page (main content)

**Background:** White. Comfortable max-width (e.g. 1200–1400px) centered if you want.

**Sections (in order):**

1. **Welcome block**
   - **H1:** "Welcome to One Hope Resources" (or your name).
   - **Subtext:** One short sentence on who it's for and what they'll find.
   - Typography: H1 ~30px, weight 700, color `#303c46` (dark gray). Body text slightly smaller, same gray family.

2. **Featured Resources**
   - **H2:** "Featured Resources" (~24px, weight 700, `#1d252c`).
   - **Horizontal carousel** of collection cards.
   - Left/right **chevron buttons** (prev/next). Disabled state when at start/end.
   - **Cards:** image (or placeholder) + title + short description + optional action icons (bookmark, download, etc.). Card border-radius ~12px; subtle shadow or border on hover.

3. **Optional promo block**
   - Single CTA (e.g. "Explore [X]" with description and "Learn More" button).  
   - Highlands uses a blue block here; you can use One Hope primary color.

4. **New Collections**
   - Same pattern as Featured: H2 + horizontal carousel of collection cards.

5. **Trending**
   - H2 + horizontal carousel again (data = "trending" or recently popular).

6. **Recently Viewed**
   - H2 + horizontal carousel (per-user; from cookies or auth).

**Section spacing:** Clear vertical gaps between sections (e.g. 32–48px). Optional horizontal separators between major blocks.

---

## 5. Collection page (single collection)

**Layout (top to bottom):**

1. **Header**
   - **Title:** Collection name (e.g. "2025 | Elementary | Series 2 | Love") – large, bold, dark.
   - **Description:** One or two sentences. Slightly smaller body text.

2. **Hero + actions row**
   - **Left:** Large collection image (or placeholder). Aspect ratio ~16:9 or 2:1; rounded corners optional.
   - **Right (or below on mobile):** Action buttons:
     - **Bookmark** (outline icon + "Bookmark Collection").
     - **Remove Implementation** (if you support that).
     - **Download All** (primary: downloads zip or triggers multi-file download from S3).

3. **Separator** (line or spacing)

4. **Sections** (repeat for each section from Sanity)
   - **Section heading** (H2): e.g. "Series Overview & Art", "Video Content", "Small Group Leader Guides".
   - **Resource grid/list:** Each resource = card or row with:
     - Thumbnail (or icon by type: video, PDF, etc.).
     - Title.
     - Optional subtitle/category.
     - **Actions:** e.g. download icon, open/preview icon (and bookmark if you support it).
   - If a section has many items: show first N, then **"Load More"** button (or "View all" link).

5. **Related Resources** (bottom)
   - H2 "Related Resources".
   - Horizontal row or grid of collection cards (same card style as home), linking to other collections.

**Typography (collection page):**
- Reuse same H1/H2/body system as home. Keep titles and section headings bold and dark for hierarchy.

---

## 6. Card design (collection + resource)

**Collection card (home / carousels):**
- **Image:** Top or full-bleed; aspect ratio consistent (e.g. 4:3 or 1:1). Border-radius 12px.
- **Content:** Title (bold), optional category/tag line, short description (1–2 lines).
- **Actions:** Small icon buttons (bookmark, download, etc.) – optional.
- **Hover:** Slight lift (e.g. `transform: translateY(-2px)`) and/or stronger shadow; cursor pointer.
- **Click:** Whole card links to `/collection/[id]`.

**Resource card (inside a collection):**
- **Thumbnail:** Left or top; fixed size (e.g. 80×80 or 120×90). Icon fallback for non-image types.
- **Title + optional subtitle.**  
- **Actions:** Download, Preview (if applicable). Same icon style as elsewhere.
- **Hover:** Background or border change so it's clear it's clickable.

---

## 7. One Hope branding – colors and typography

**Match the One Hope website** (onehope-production) so the file-sharing app feels like the same brand. Use the main site’s `styles/_variables.scss` as the source of truth.

**Colors (from One Hope `_variables.scss`):**
- **Primary:** `#0092cc` – use for primary buttons, “Invite”, “Download All”, links, and key CTAs.
- **Secondary:** `#0092cc` (same as primary).
- **White:** `#ffffff` – main content background, button text on primary.
- **Black (text):** `#3C464A` – body and headings.
- **Gray:** `#f1f3f4` – subtle backgrounds, borders.
- **Info / light bg:** `#eef1f2` – optional for cards or alternate sections.

**Sidebar (align with layout):**
- Background in the dark range (e.g. `#1d252d`–`#212121`); sidebar text `#98a5af`; active/hover can use primary `#0092cc` or white/10%.
- **Main area:** Background `#ffffff`; text `#3C464A`.

**Typography (from One Hope):**
- **Font stack:** `Avenir, Helvetica, Arial, Verdana, sans-serif`.
- **Base:** ~17px root; body ~1.11rem; line-height ~1.3.
- **H1:** ~2.5× base, weight 700.
- **H2:** ~2× base, weight 700.
- **Body:** base size, weight 400; slightly smaller for descriptions and metadata.

Use these values in CSS variables or your design tokens so the Resources app matches the One Hope website branding and colors.

---

## 8. Responsive behavior

- **Desktop:** Sidebar fixed 280–320px; main content fluid.
- **Tablet:** Same or slightly narrower sidebar; carousels show fewer cards per view.
- **Mobile:**  
  - Sidebar → drawer (slide from left) triggered by hamburger in top bar.  
  - Top bar: search can collapse to icon; avatar + Invite stay.  
  - Home: carousels become horizontal scroll or single column.  
  - Collection: hero and actions stack; sections and resource cards stack vertically.

---

## 9. Implementation checklist (for One Hope)

- [ ] Two-column layout: fixed dark sidebar + fluid main content.
- [ ] Sidebar: logo, Home / My Resources (and optional My Organization), categories with icons, About / Contact / Privacy.
- [ ] Top bar: search, avatar, Invite button.
- [ ] Home: welcome block, Featured / New / Trending / Recently Viewed carousels with collection cards.
- [ ] Collection page: title, description, hero image, Bookmark + Download All (and optional Remove), sections with resource cards, Related Resources.
- [ ] Collection and resource cards: image/thumbnail, title, description or metadata, action icons; hover states; link to collection or download.
- [ ] Typography and colors aligned with this plan and One Hope brand.
- [ ] Mobile: drawer nav, stacked layout, touch-friendly carousels or list.

Backend and data (Sanity + S3, auth, presigned URLs) stay as in `HIGHLANDS_RESOURCES_RESEARCH.md`; this plan only defines layout and visual design.
