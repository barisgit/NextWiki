import path from "path";
import type { NextConfig } from "next";

const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  turbopack: {},
  // Configure standalone output
  output: "standalone",
};

// module.exports = withBundleAnalyzer(nextConfig);
export default withBundleAnalyzer(nextConfig);
