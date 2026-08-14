import { createClient } from "@supabase/supabase-js";

// ───── lib/slug.ts 와 동일한 로직 (타입 표기만 제거) ─────

function extractEnglish(title) {
  const inside = title.match(/\(([^)]*)\)/)?.[1] ?? "";
  const outside = title.replace(/\([^)]*\)/g, "");

  const candidates = [inside, outside]
    .map((part) => {
      const matched = part.match(/[A-Za-z][A-Za-z0-9'’.\- ]*/g);
      return matched ? matched.join(" ").trim() : "";
    })
    .filter((t) => /[A-Za-z]/.test(t));

  if (candidates.length === 0) return null;
  return candidates.sort((a, b) => b.length - a.length)[0];
}

function makeSlug(title, width, height, id) {
  const english = extractEnglish(title);
  const source = english ?? title.replace(/\([^)]*\)/g, "");

  const body = source
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  const safe = body || `puzzle-${id.slice(0, 8)}`;
  const trimmed = safe.slice(0, 40).replace(/-+$/, "");
  return `${trimmed}-${width}x${height}`;
}

// ───── 백필 실행 ─────

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("❌ 환경변수가 없습니다. .env.local 을 확인하세요.");
  console.error("   NEXT_PUBLIC_SUPABASE_URL");
  console.error("   SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

const { data: puzzles, error } = await supabase
  .from("puzzles")
  .select("id, title, width, height, slug")
  .order("created_at", { ascending: true });

if (error) {
  console.error("❌ 조회 실패:", error.message);
  process.exit(1);
}

console.log(`총 ${puzzles.length}개 퍼즐을 확인합니다.\n`);

const used = new Set(puzzles.filter((p) => p.slug).map((p) => p.slug));
let updated = 0;
let skipped = 0;

for (const p of puzzles) {
  if (p.slug) {
    skipped++;
    continue;
  }

  const base = makeSlug(p.title, p.width, p.height, p.id);

  let candidate = base;
  let n = 2;
  while (used.has(candidate)) {
    candidate = `${base}-${n++}`;
  }
  used.add(candidate);

  const { error: upErr } = await supabase
    .from("puzzles")
    .update({ slug: candidate })
    .eq("id", p.id);

  if (upErr) {
    console.log(`❌ ${p.title} → ${upErr.message}`);
  } else {
    console.log(`✅ ${p.title}  →  ${candidate}`);
    updated++;
  }
}

console.log(`\n완료: ${updated}개 생성, ${skipped}개 건너뜀`);