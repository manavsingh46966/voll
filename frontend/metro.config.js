const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// exact path to your global.css file
module.exports = withNativeWind(config, { input: "./global.css" });