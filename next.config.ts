import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    dangerouslyAllowSVG: true,
    remotePatterns: [],
  },
  // Allow data: URIs for QR codes in next/image
  experimental: {},
};

export default nextConfig;
