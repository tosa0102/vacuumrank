/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      { source: '/uk/robot-vacuums', destination: '/robot-vacuums', permanent: true },
      { source: '/uk', destination: '/', permanent: true },
      // Om du har fler UK-sidor, lägg dem här på samma sätt.
      { source: '/uk/best-robot-vacuum-2025', destination: '/best-robot-vacuum-2025', permanent: true },
    ];
  },
};

export default nextConfig;
