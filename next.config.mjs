/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "placehold.co" }],
  },
  serverExternalPackages: ["@prisma/client", "firebase-admin"],
};

export default nextConfig;
