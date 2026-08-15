import { createClient } from "@supabase/supabase-js";
import { makeSlug } from "../lib/slug.js"; // 또는 함수를 이 파일에 그대로 복사

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const { data: puzzles, error } = await supabase
  .from("puzzles")
  .select("id, title, width, height, slug");

if (error) throw error;

const used = new Set(puzzles.filter((p) => p.slug).map((p) => p.slug));

for (const p of puzzles) {
  if (p.slug) continue; // 이미 있으면 건너뜀

  let slug = makeSlug(p.title, p.width, p.height, p.id);

  // 중복이면 -2, -3 붙이기
  let n = 2;
  let candidate = slug;
  while (used.has(candidate)) {
    candidate = `${slug}-${n++}`;
  }
  used.add(candidate);

  const { error: upErr } = await supabase
    .from("puzzles")
    .update({ slug: candidate })
    .eq("id", p.id);

  console.log(upErr ? `❌ ${p.title}` : `✅ ${p.title} → ${candidate}`);
}

