/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Permissions-Policy',
            value: 'browsing-topics=*, interest-cohort=*, private-state-token-issuance=*, private-state-token-redemption=*'
          }
        ]
      }
    ]
  }
};

export default nextConfig;