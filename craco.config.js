module.exports = {
  webpack: {
    configure: {
      resolve: {
        fallback: {
          "path": require.resolve("path-browserify"),
          "fs": false,
          "crypto": false,
          "stream": false,
          "buffer": false,
          "util": false,
          "http": false,
          "https": false,
          "zlib": false,
          "url": false,
          "net": false,
          "tls": false,
          "dns": false,
          "child_process": false,
          "os": false,
          "assert": false,
          "querystring": false,
          "punycode": false,
          "string_decoder": false,
          "stringify": false,
          "vm": false,
          "constants": false,
          "domain": false,
          "dgram": false,
          "process": false,
          "readline": false,
          "repl": false,
          "sys": false,
          "timers": false,
          "tty": false,
          "v8": false
        }
      }
    }
  }
}; 