import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output für Docker-Deployment (minimales node_modules)
  output: 'standalone',
  
  // React Compiler für Performance
  reactCompiler: true,
  
  // Remote Images (falls Directus-Bilder geladen werden)
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8055',
        pathname: '/assets/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '8055',
        pathname: '/assets/**',
      },
    ],
  },
};

export default nextConfig;
