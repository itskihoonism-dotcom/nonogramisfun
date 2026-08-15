import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/play-puzzle"],
    },
    sitemap: "https://nonogramisfun.com/sitemap.xml",
  };
}