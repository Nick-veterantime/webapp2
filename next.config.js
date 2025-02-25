/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  // Disable static rendering for pages that need authentication
  output: 'standalone',
  staticPageGenerationTimeout: 300,
  experimental: {
    // This will allow environment variables to be properly used during build
    serverComponentsExternalPackages: ['@supabase/ssr']
  },
  // Disable static generation for dynamic routes
  generateStaticParams: async () => {
    return [];
  },
  // Configure which pages are statically generated vs. dynamic
  unstable_staticGeneration: {
    basePath: ['/'],
    dynamic: 'force-dynamic'
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Permissions-Policy',
            value: 'interest-cohort=(), browsing-topics=(), private-state-token-issuance=(), private-state-token-redemption=(), run-ad-auction=(), join-ad-interest-group=(), idle-detection=(), screen-wake-lock=(), serial=(), sync-xhr=(), window-management=()'
          }
        ]
      }
    ];
  }
};

module.exports = nextConfig; 