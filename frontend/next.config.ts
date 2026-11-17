import path from "node:path";
import type { NextConfig } from "next";

// Backend (FastAPI). Brauzer /api/* ga murojaat qiladi — bir xil origin, httpOnly cookie ishlaydi.
const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8100";

const nextConfig: NextConfig = {
  cacheComponents: true,
  devIndicators: false,
  partialPrefetching: true,
  turbopack: {
    // umumiy kontent (../content/*.json) frontend papkasidan tashqarida
    root: path.join(__dirname, ".."),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  outputFileTracingRoot: path.join(__dirname, ".."),
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${BACKEND_URL}/api/:path*` }];
  },
};

export default nextConfig;
