import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { schemaTypes } from "./schemas";
import { structure } from "./structure";

// Sanity Studio only injects env vars prefixed with SANITY_STUDIO_ (see https://sanity.io/docs/studio/environment-variables)
const projectId = process.env.SANITY_STUDIO_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "";
const dataset = process.env.SANITY_STUDIO_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET || "production";

if (!projectId) {
  throw new Error(
    'Missing Sanity project ID. Create studio/.env with:\n  SANITY_STUDIO_PROJECT_ID=your-project-id\n  SANITY_STUDIO_DATASET=production\n(Use the same project ID as in web/.env.local or copy from sanity.io dashboard → Project settings.)'
  );
}

export default defineConfig({
  name: "onehope-resources",
  title: "One Hope Resources",
  projectId,
  dataset,
  plugins: [
    structureTool({ structure }),
    visionTool({ defaultApiVersion: "2024-01-01" }),
  ],
  schema: {
    types: schemaTypes,
  },
});
