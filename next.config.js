/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Permissions-Policy',
            value: 'interest-cohort=(), browsing-topics=(), private-state-token-issuance=(), private-state-token-redemption=()'
          }
        ]
      }
    ];
  }
};

module.exports = nextConfig; 