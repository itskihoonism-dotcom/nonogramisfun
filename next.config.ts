if (process.platform === "win32") {
  require("win-ca");
}


import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ["192.168.219.108"],
};

export default nextConfig;