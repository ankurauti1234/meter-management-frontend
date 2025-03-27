/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image-processing-stored-data.s3.ap-south-1.amazonaws.com",
        port: "", // Leave empty unless using a specific port
        pathname: "/Frames/analayzed_frames/**", // Matches your S3 image paths
      },
    ],
  },
};

export default nextConfig;