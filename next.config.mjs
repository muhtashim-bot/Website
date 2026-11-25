/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  // The review build (ARTIFACT=1) serves assets from /site so they can be renamed for hosting.
  assetPrefix: process.env.ARTIFACT === '1' ? '/site' : undefined,
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
  devIndicators: false,
};

export default nextConfig;
