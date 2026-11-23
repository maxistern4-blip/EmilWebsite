import type { NextConfig } from "next";
const repository = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "EmilWebsite";
const basePath = process.env.GITHUB_ACTIONS === "true" ? `/${repository}` : "";
const nextConfig: NextConfig = { output: "export", outputFileTracingRoot: process.cwd(), trailingSlash: true, basePath, assetPrefix: basePath, images: { unoptimized: true }, env: { NEXT_PUBLIC_BASE_PATH: basePath } };
export default nextConfig;
