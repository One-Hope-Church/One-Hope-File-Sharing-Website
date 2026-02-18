# One Hope Resources – Sanity Studio

Content management for collections, sections, and resources. Uses the same Sanity project/dataset as the Next.js app.

## Setup

1. **Env**  
   Copy your project ID and dataset from `web/.env.local` into `studio/.env`:
   ```env
   NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id
   NEXT_PUBLIC_SANITY_DATASET=production
   ```

2. **Install and run**
   ```bash
   cd studio
   npm install
   npm run dev
   ```
   Studio opens at **http://localhost:3333**.

## Document types

- **Resource** – Single file (title, description, file type, S3 key, optional thumbnail, order). Create these first; admins can also create them when uploading via the app.
- **Resource section** – Group of resources (title, list of resource refs, order). e.g. “Video Content”, “Service Flows”.
- **Resource collection** – Top-level collection (title, slug, description, hero image, featured, category, sections, related collections, order). Slug is used in the URL: `/collection/[slug]`.

## Workflow

1. Create **Resources** (add S3 key after uploading via the app, or type it if the file is already in S3).
2. Create **Resource sections** and add resource references.
3. Create **Resource collections** and add section references. Set **Featured** to show on the home page. Set **Slug** (e.g. `message-series-2024`) for the collection URL.
