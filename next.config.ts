import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: process.env.NODE_ENV === "production" ? "/release-flow" : "",
  assetPrefix: process.env.NODE_ENV === "production" ? "/release-flow/" : "",
};

export default nextConfig;
