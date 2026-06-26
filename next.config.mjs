/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        // Vercel Blob Storage — product and banner images
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
      {
        // Allow any HTTPS image for now (tighten in production
        // by replacing with your specific Blob hostname)
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
