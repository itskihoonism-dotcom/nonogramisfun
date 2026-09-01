if (process.platform === "win32") {
  require("win-ca");
}


import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ["192.168.219.108"],


async redirects() {
  return [
    { source: "/puzzle/donald-trump-80x80",
      destination: "/puzzle/blond-american-politician-80x80", permanent: true },
    { source: "/puzzle/thor-80x80",
      destination: "/puzzle/god-of-thunder-80x80", permanent: true },
    { source: "/puzzle/professor-severus-snape-80x80",
      destination: "/puzzle/professor-of-magic-80x80", permanent: true },
  ];
}



  
};




export default nextConfig;

