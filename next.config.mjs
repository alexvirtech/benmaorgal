const STARFALL_ORIGIN = 'https://starfall-arena-alexvirtechs-projects.vercel.app'

const nextConfig = {
  async redirects() {
    return [
      { source: '/game', destination: '/battle/', permanent: true },
      { source: '/game/:path*', destination: '/battle/:path*', permanent: true },
    ]
  },
  async rewrites() {
    return [
      { source: '/battle', destination: '/battle/index.html' },
      // Starfall Arena game, deployed as its own Vercel project
      { source: '/stars', destination: `${STARFALL_ORIGIN}/stars/` },
      { source: '/stars/:path*', destination: `${STARFALL_ORIGIN}/stars/:path*` },
    ]
  },
  trailingSlash: false,
}

export default nextConfig
