module.exports = {
  webpack: {
    configure: {
      resolve: {
        fallback: {
          crypto: false,
          fs: false,
          stream: false,
          buffer: false,
          path: false
        }
      }
    }
  },
  devServer: {
    hot: false // Disable Hot Module Replacement
  }
}; 