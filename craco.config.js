module.exports = {
  webpack: {
    configure: {
      resolve: {
        fallback: {
          crypto: require.resolve('crypto-browserify'),
          stream: require.resolve('stream-browserify'),
          path: require.resolve('path-browserify'),
          fs: false,
          buffer: false
        }
      },
    },
    plugins: []
  },
  devServer: {
    hot: false
  }
}; 