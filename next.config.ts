import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        // Redirect legacy /product/:id URLs to the API endpoint which resolves the slug-based SEO URL
        source: "/product/:id",
        destination: "/api/redirect-product/:id",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
