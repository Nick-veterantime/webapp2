/** @type {import('next').NextConfig} */
const nextConfig = {
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