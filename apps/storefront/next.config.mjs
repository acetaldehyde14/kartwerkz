/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output for the production Docker image (see Dockerfile) —
  // bundles a minimal node_modules tree so the final image stays small.
  output: 'standalone',

  // typedRoutes is stable as of Next.js 15 and gives us compile-time
  // checked `href` values (e.g. in <Link href="/configurator">).
  typedRoutes: true,

  // Hand-authored workspace packages are consumed as TS source, not
  // pre-built dist output, so Next needs to transpile them itself.
  transpilePackages: ['@kartwerkz/ui', '@kartwerkz/api-client', '@kartwerkz/shared'],

  images: {
    remotePatterns: [
      {
        // Local MinIO (S3-compatible) dev endpoint — see .env.example
        // S3_ENDPOINT / MINIO_API_PORT. Swap/extend this for the real
        // production object storage domain before go-live.
        protocol: 'http',
        hostname: 'localhost',
        port: '9000',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
