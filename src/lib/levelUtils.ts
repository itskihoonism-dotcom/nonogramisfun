function cumulativeForLevel(level: number): number {
  return 50 * (level - 1) * (level + 6);
}

export function getLevel(points: number): number {
  const p = points || 0;
  let level = 1;
  for (let l = 2; l <= 99; l++) {
    if (p >= cumulativeForLevel(l)) level = l;
    else break;
  }
  return level;
}
export async function getAuthorBadgeMap(supabase: any, authors: string[]) {
  const uniqueAuthors = Array.from(new Set(authors.filter(Boolean)));
  if (uniqueAuthors.length === 0) return {};

  const { data } = await supabase.from("user_ids").select("nickname, points, custom_id").in("nickname", uniqueAuthors);
  const map: Record<string, { points: number; isAdmin: boolean }> = {};
  (data || []).forEach((u: any) => {
    map[u.nickname] = { points: u.points || 0, isAdmin: u.nickname === "주인장" || u.custom_id === "admin" };
  });
  return map;
}