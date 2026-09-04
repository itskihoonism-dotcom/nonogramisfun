import { createClient } from "../../../lib/supabaseServer";
import Link from "next/link";
import PlayPuzzleClient from "../../../components/PlayPuzzleClientLoader";
import KakaoAd from "../../../components/KakaoAd";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { getAuthorBadgeMap, getLevel } from "../../../lib/levelUtils";
import LevelBadge from "../../../components/LevelBadge";
import { sanitizeContent } from "@/lib/sanitize";
import PuzzleViewStats from "@/components/PuzzleViewStats";

const SITE_NAME = "NONOGRAM IS FUN";
const SITE_URL = "https://nonogramisfun.com";

export const revalidate = 30;

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

// 🌟 설명문이 있으면 그걸 쓰고, 없으면 기존 문구
const plain = (puzzle.content ?? "")
  .replace(/<[^>]*>/g, " ")
  .replace(/&nbsp;/g, " ")
  .replace(/\s+/g, " ")
  .trim();

const description = plain
  ? (plain.length > 155 ? plain.slice(0, 155) + "…" : plain)
  : `${author}님이 만든 ${size} 크기의 창작 노노그램(네모로직) 퍼즐입니다. 설치 없이 웹에서 무료로 플레이해 보세요.`;

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

  // 🌟 미승인 퍼즐은 이 주소로 아무도 못 봄 (관리자는 목록의 "미리보기"나 격자 수정 화면에서 확인)
  if (!puzzle.is_approved) notFound();

  const supabase = await createClient();

  const authorInfoMap = await getAuthorBadgeMap(supabase, [puzzle.author]);
  const authorInfo = authorInfoMap[puzzle.author];

const formatDate = (dateString: string) => {
  if (!dateString) return "";
  const utcString = /Z$|[+-]\d{2}:?\d{2}$/.test(dateString) ? dateString : dateString + "Z";
  const kst = new Date(new Date(utcString).getTime() + 9 * 60 * 60 * 1000);
  return `${kst.getUTCFullYear()}.${String(kst.getUTCMonth() + 1).padStart(2, "0")}.${String(kst.getUTCDate()).padStart(2, "0")}`;
};

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
      <div className="read-meta-box" style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "15px" }}>
        <div className="read-avatar" style={{ width: "32px", height: "32px", borderRadius: "50%", background: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {authorInfo ? <LevelBadge level={getLevel(authorInfo.points)} isAdmin={authorInfo.isAdmin} /> : "👤"}
        </div>
        <div className="read-meta-text" style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <span className="read-author" style={{ fontSize: "14px", fontWeight: "bold", color: "#333" }}>{puzzle.author || "익명"}</span>
          <span className="read-time-views" style={{ fontSize: "12px", color: "#888" }}>
            {formatDate(puzzle.created_at)} | <PuzzleViewStats puzzleId={puzzle.id} initialViews={puzzle.views || 0} />
          </span>
        </div>
      </div>
      <PlayPuzzleClient puzzle={{ ...puzzle, content: sanitizeContent(puzzle.content) }} />
    </div>
  );
}