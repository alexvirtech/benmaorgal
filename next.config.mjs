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
    ]
  },
  trailingSlash: false,
}

export default nextConfig
