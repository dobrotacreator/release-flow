import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: process.env.NODE_ENV === "production" ? "/pet_release-flow" : "",
  assetPrefix: process.env.NODE_ENV === "production" ? "/pet_release-flow/" : "",
};

export default nextConfig;
