/** @type {import('next').NextConfig} */
const nextConfig = {
    images : {
        remotePatterns: [
            {
                hostname: 'placehold.co'
            }
        ]
    },
    serverExternalPackages: ["@prisma/client", "some-package"]

};

export default nextConfig;
