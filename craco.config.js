const webpack = require('webpack');

module.exports = {
  webpack: {
    configure: {
      resolve: {
        fallback: {
          "fs": false,
          "path": false,
          "crypto": false,
          "stream": false,
          "util": false,
          "buffer": false,
          "process": false,
          "os": false,
          "url": false,
          "assert": false,
          "http": false,
          "https": false,
          "zlib": false,
          "querystring": false,
          "vm": false
        }
      }
    },
    plugins: {
      add: [
        new webpack.DefinePlugin({
          'process.env': JSON.stringify(process.env)
        })
      ]
    }
  }
};