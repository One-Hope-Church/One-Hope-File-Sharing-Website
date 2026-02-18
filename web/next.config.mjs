import { readFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env from same directory as next.config so NEXT_PUBLIC_* are set for client bundle
try {
  const envPath = resolve(__dirname, ".env");
  const envContent = readFileSync(envPath, "utf8");
  for (const line of envContent.split("\n")) {
    const match = line.match(/^NEXT_PUBLIC_SUPABASE_(URL|ANON_KEY)=(.*)$/);
    if (match) {
      const value = match[2].trim().replace(/^["']|["']$/g, "");
      if (value && !process.env[`NEXT_PUBLIC_SUPABASE_${match[1]}`]) {
        process.env[`NEXT_PUBLIC_SUPABASE_${match[1]}`] = value;
      }
    }
  }
} catch (_) {}

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.sanity.io", pathname: "/**" },
    ],
  },
};

export default nextConfig;
