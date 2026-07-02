import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow custom server (Socket.io integration)
  // This disables the built-in server so we can use our own
  experimental: {
    serverActions: {
      allowedOrigins: ["*"],
    },
  },
};

export default nextConfig;
