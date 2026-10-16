import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  experimental: {
    /**
     * Keep rendered pages in the client cache for a short while.
     *
     * Dynamic routes have client caching off by default, so returning to a tab
     * you were just on re-rendered it on the server from scratch. Thirty
     * seconds is long enough to make moving back and forth between tabs
     * instant, and short enough that a trainer marking work still sees their
     * change when they navigate back to it.
     */
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },
};

export default nextConfig;
