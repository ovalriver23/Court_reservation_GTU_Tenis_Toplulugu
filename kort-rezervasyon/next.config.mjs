/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    // Next 15'te sayfalar istemcide hiç önbelleğe alınmıyor; her sekme geçişi
    // sunucuya gidiyor. Next 14'teki davranışa dönmek için 30 sn önbellek.
    staleTimes: {
      dynamic: 30,
    },
  },
};

export default nextConfig;
