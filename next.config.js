/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Add external hosts we load avatars/images from
    domains: [
      'your-project.supabase.co',
      'lh3.googleusercontent.com',
      'images.unsplash.com',
      'pbs.twimg.com',
      'cdn.discordapp.com',
      'avatars.githubusercontent.com'
    ],
  },
}

module.exports = nextConfig 