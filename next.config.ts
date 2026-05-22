import type { NextConfig } from 'next'

const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
]

const nextConfig: NextConfig = {
  reactCompiler: true,

  // Atur NGROK_URL di .env.local kalau demo pakai ngrok
  ...(process.env.NGROK_URL ? { allowedDevOrigins: [process.env.NGROK_URL] } : {}),

  experimental: {
    serverActions: { bodySizeLimit: '5mb' },
  },

  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }]
  },
}

export default nextConfig
