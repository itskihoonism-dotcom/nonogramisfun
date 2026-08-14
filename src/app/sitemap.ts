import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabaseServer";

const SITE_URL = "https://nonogramisfun.com";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  const [{ data: puzzles }, { data: posts }] = await Promise.all([
    supabase
      .from("puzzles")
      .select("slug, created_at")
      .eq("is_approved", true)
      .not("slug", "is", null),
    supabase.from("community_posts").select("id, created_at"),
  ]);

  return [
    { url: SITE_URL, priority: 1, changeFrequency: "daily" },
    { url: `${SITE_URL}/all-puzzles`, priority: 0.9, changeFrequency: "daily" },
    { url: `${SITE_URL}/community`, priority: 0.9, changeFrequency: "daily" },
    { url: `${SITE_URL}/make-puzzle`, priority: 0.5 },
    { url: `${SITE_URL}/notice`, priority: 0.4 },
    { url: `${SITE_URL}/privacy`, priority: 0.3 },
    { url: `${SITE_URL}/terms`, priority: 0.3 },
    ...(puzzles ?? []).map((p) => ({
      url: `${SITE_URL}/puzzle/${encodeURIComponent(p.slug)}`,
      lastModified: new Date(p.created_at + "Z"),
      priority: 0.7,
      changeFrequency: "monthly" as const,
    })),
    ...(posts ?? []).map((p) => ({
      url: `${SITE_URL}/community/${p.id}`,
      lastModified: p.created_at,
      priority: 0.6,
      changeFrequency: "monthly" as const,
    })),
  ];
}