/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@cassini/analytics"],
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@cassini/analytics/next$": require.resolve(
        "@cassini/analytics/dist/next/index.js"
      ),
      "@cassini/analytics/next/server$": require.resolve(
        "@cassini/analytics/dist/next/server/index.js"
      ),
    };
    return config;
  },
};

module.exports = nextConfig;
