import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  serverExternalPackages: ["pdfkit"],

  // Disable all dev indicators
  devIndicators: false,
};

export default nextConfig;
