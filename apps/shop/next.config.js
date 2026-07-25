import process from "node:process";

const posthogIngestHost = process.env.POSTHOG_INGEST_HOST?.replace(/\/$/, "");
const posthogAssetHost = process.env.POSTHOG_ASSET_HOST?.replace(/\/$/, "");
const posthogProxyReady = Boolean(posthogIngestHost && posthogAssetHost);

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_POSTHOG_PROXY_READY: posthogProxyReady ? "true" : "false",
  },
  skipTrailingSlashRedirect: true,
  transpilePackages: [
    "@wuliuqi/db",
    "@wuliuqi/domain",
    "@wuliuqi/types",
    "@wuliuqi/ui",
    "@wuliuqi/utils",
    "@wuliuqi/validators",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
  async rewrites() {
    if (!posthogProxyReady) {
      return [];
    }

    return [
      {
        source: "/ingest/static/:path*",
        destination: `${posthogAssetHost}/static/:path*`,
      },
      {
        source: "/ingest/:path*",
        destination: `${posthogIngestHost}/:path*`,
      },
    ];
  },
};

export default nextConfig;
