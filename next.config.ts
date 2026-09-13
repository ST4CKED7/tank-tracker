import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  // Phone camera JPEGs often exceed the default ~1MB server-action body cap.
  experimental: {
    serverActions: {
      bodySizeLimit: "8mb",
    },
  },
}

export default nextConfig
