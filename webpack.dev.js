const join = require("path").join;
const { merge } = require("webpack-merge");
const common = require("./webpack.common");
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");

module.exports = merge(common, {
	mode: "development",
	devtool: "inline-source-map",
	plugins: process.argv.some(v => v.includes("webpack-dev-server")) ? [] : [
        new NodePolyfillPlugin()
	]
});