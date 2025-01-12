/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@cassini/analytics"],
  webpack: (config, { isServer }) => {
    // Ensure Next.js uses the correct entry points for our package
    config.resolve.alias = {
      ...config.resolve.alias,
      "@cassini/analytics/next": "@cassini/analytics/dist/next/index.js",
      "@cassini/analytics/next/server":
        "@cassini/analytics/dist/next/server.js",
    };

    return config;
  },
};

module.exports = nextConfig;
