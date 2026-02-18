import { config } from "dotenv";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { loadEnv } from "vite";
import { defineCliConfig } from "sanity/cli";

// Resolve studio dir so .env is found regardless of cwd (e.g. when run from repo root)
const studioDir = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(studioDir, ".env") });
config({ path: resolve(studioDir, "../web/.env") });

const projectId = process.env.SANITY_STUDIO_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "";
const dataset = process.env.SANITY_STUDIO_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET || "production";

export default defineCliConfig({
  api: {
    projectId,
    dataset,
  },
  studioHost: "onehope-resources",
  // Ensure SANITY_STUDIO_* are available in the browser when running sanity dev
  vite: (viteConfig, { mode }) => {
    const env = loadEnv(mode, studioDir, "");
    return {
      ...viteConfig,
      define: {
        ...viteConfig.define,
        "process.env.SANITY_STUDIO_PROJECT_ID": JSON.stringify(
          env.SANITY_STUDIO_PROJECT_ID || env.NEXT_PUBLIC_SANITY_PROJECT_ID || ""
        ),
        "process.env.SANITY_STUDIO_DATASET": JSON.stringify(
          env.SANITY_STUDIO_DATASET || env.NEXT_PUBLIC_SANITY_DATASET || "production"
        ),
      },
    };
  },
});
