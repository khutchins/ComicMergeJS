const path = require('path');
const join = require("path").join;
const CopyPlugin = require("copy-webpack-plugin");
const buildDir = join(__dirname, "dist");

module.exports = {
  entry: './src/index.ts',
  devtool: 'inline-source-map',
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: join(__dirname, "www"), to: buildDir }
      ]
    })
  ],
  output: {
    filename: 'bundle.js',
    path: path.resolve(buildDir),
    clean: true,
  },
};