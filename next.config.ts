import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // firebase-admin é pesado e feito pra Node — não empacota, resolve em runtime.
  // Também usado dentro do proxy.ts (que roda no runtime Node no Next 16).
  serverExternalPackages: ["firebase-admin"],
};

export default nextConfig;
