/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
      domains: ['image-processing-stored-data.s3.ap-south-1.amazonaws.com'],
      // Or if you prefer to use remotePatterns (recommended for more flexibility):
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'image-processing-stored-data.s3.ap-south-1.amazonaws.com',
          port: '', // Leave empty unless using a specific port
          pathname: '/Frames/analayzed_frames/**', // Optional: specify path pattern
        },
      ],
    },
  };
  
  export default nextConfig;