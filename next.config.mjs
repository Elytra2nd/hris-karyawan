/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb', // Mengizinkan upload hingga 5 MB
    },
  },
};

export default nextConfig;