// 제목에서 영문 부분을 뽑아냅니다. 괄호 안팎 어느 쪽이든 대응합니다.
function extractEnglish(title: string): string | null {
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

export function makeSlug(
  title: string,
  width: number,
  height: number,
  id: string
): string {
  const english = extractEnglish(title);

  // 영문이 없으면 제목(괄호 제외)을 그대로 사용 — 한글도 허용
  const source =
    english && english.trim() ? english : title.replace(/\([^)]*\)/g, "");

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