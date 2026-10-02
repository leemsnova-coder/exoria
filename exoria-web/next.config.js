/** Exoria web config. All backend URLs come from environment variables (see .env.example). */
const required = ['NEXT_PUBLIC_EXORIA_BASE_URL', 'NEXT_PUBLIC_EXORIA_API_FORMAT'];
for (const key of required) {
  if (!process.env[key]) {
    // Fail at build/start time instead of shipping a site that calls "undefined/..."
    throw new Error(`Missing ${key}. Copy .env.example to .env.local and fill it in.`);
  }
}

module.exports = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [{
      source: '/:path*',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      ],
    }];
  },
};
