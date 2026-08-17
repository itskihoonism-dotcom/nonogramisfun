import { createClient } from "../../../lib/supabaseServer";
import Link from "next/link";
import PlayPuzzleClient from "../../../components/PlayPuzzleClient";
import KakaoAd from "../../../components/KakaoAd";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

const SITE_NAME = "NONOGRAM IS FUN";
const SITE_URL = "https://nonogramisfun.com";

export const dynamic = "force-dynamic";

// slug로 조회 (기존은 id 기준이었음)
const getPuzzle = cache(async (slug: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("puzzles")
    .select("*")
    .eq("slug", decodeURIComponent(slug))
    .single();
  return data;
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const puzzle = await getPuzzle(slug);

  if (!puzzle) {
    return {
      title: `퍼즐을 찾을 수 없습니다 | ${SITE_NAME}`,
      robots: { index: false, follow: true },
    };
  }

  const size = `${puzzle.width}x${puzzle.height}`;
  const author = puzzle.author ?? "회원";
  const heading = `${puzzle.title} ${size} 노노그램`;
  const description = `${author}님이 만든 ${size} 크기의 창작 노노그램(네모로직) 퍼즐입니다. 설치 없이 웹에서 무료로 플레이해 보세요.`;
  const url = `${SITE_URL}/puzzle/${encodeURIComponent(puzzle.slug)}`;

  return {
    title: `${heading} | ${SITE_NAME}`,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: heading,
      description,
      url,
      siteName: SITE_NAME,
      type: "article",
      publishedTime: puzzle.created_at,
    },
    twitter: {
      card: "summary",
      title: heading,
      description,
    },
  };
}

export default async function PuzzlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const puzzle = await getPuzzle(slug);

  if (!puzzle) notFound();

  const supabase = await createClient();

  // 🌟 미승인 퍼즐은 관리자(주인장)만 볼 수 있음
  if (!puzzle.is_approved) {
    const { data: { user } } = await supabase.auth.getUser();
    let isAdmin = false;
    if (user?.email) {
      const { data: userData } = await supabase
        .from("user_ids")
        .select("nickname, custom_id")
        .eq("email", user.email)
        .maybeSingle();
      isAdmin = userData?.nickname === "주인장" || userData?.custom_id === "admin";
    }
    if (!isAdmin) notFound();
  }

  // 조회수 +1 (id 기준)
  await supabase
    .from("puzzles")
    .update({ views: (puzzle.views || 0) + 1 })
    .eq("id", puzzle.id);

  return (
    <div className="view active" style={{ display: "block" }}>
      <div style={{ marginTop: "15px", marginBottom: "15px" }}>
        <div className="ad-pc">
          <KakaoAd unit="DAN-PmtHgQAd8c5EQtcy" width="728" height="90" />
        </div>

        <div className="ad-mobile">
          <KakaoAd unit="DAN-lsUhERRXp3RaORnD" width="320" height="100" />
        </div>
      </div>
      {/* 📢 카카오 애드핏 광고 끝 */}

      <div
        className="section-header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
          margin: "0 0 15px 0",
          borderBottom: "1px solid #eee",
          paddingBottom: "10px",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "18px", color: "#111", fontWeight: "bold" }}>
          {puzzle.title} ({puzzle.width}x{puzzle.height})
        </h1>
        <Link
          href="/all-puzzles"
          style={{
            background: "none",
            border: "none",
            color: "#f44336",
            fontWeight: "bold",
            cursor: "pointer",
            textDecoration: "none",
            fontSize: "14px",
          }}
        >
          ❮ 목록으로
        </Link>
      </div>

      <PlayPuzzleClient puzzle={puzzle} />
    </div>
  );
}