/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' } // permite imagens de qualquer host https (produtos com URL externa)
    ]
  },
  experimental: {
    serverActions: { bodySizeLimit: '5mb' }
  }
};

module.exports = nextConfig;
