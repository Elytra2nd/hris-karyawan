/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },
  allowedDevOrigins: ['fa1f-118-99-64-203.ngrok-free.app'],
};

export default nextConfig;