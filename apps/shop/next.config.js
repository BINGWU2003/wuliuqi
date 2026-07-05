/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@wuliuqi/db",
    "@wuliuqi/domain",
    "@wuliuqi/types",
    "@wuliuqi/ui",
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
};

export default nextConfig;
