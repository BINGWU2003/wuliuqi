/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@wuliuqi/auth",
    "@wuliuqi/db",
    "@wuliuqi/domain",
    "@wuliuqi/storage",
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
};

export default nextConfig;
