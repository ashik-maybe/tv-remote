import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  serverExternalPackages: ["@kud/androidtv-remote", "node-forge", "protobufjs"],
}

export default nextConfig
