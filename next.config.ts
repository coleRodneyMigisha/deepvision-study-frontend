import type { NextConfig } from "next";

// Static export: the whole site is pre-rendered to `out/` and served by Cloudflare Pages.
// All AI features talk to the FastAPI backend on Render from the browser.
const nextConfig: NextConfig = {
  output: "export",
  reactStrictMode: true,
  trailingSlash: true,
  images: { unoptimized: true },
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
