/** @type {import("next").NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@wuliuqi/rag",
    "@wuliuqi/rag-db",
    "@wuliuqi/types",
    "@wuliuqi/ui",
    "@wuliuqi/validators",
  ],
};

export default nextConfig;
