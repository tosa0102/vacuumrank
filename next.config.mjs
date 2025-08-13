/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      { source: '/uk/robot-vacuums', destination: '/robot-vacuums', permanent: true },
    ];
  },
};
export default nextConfig;
