import { createClient } from "../../lib/supabaseServer"; 
import AllPuzzlesClient from "../../components/AllPuzzlesClient"; 
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "퍼즐 목록 | NONOGRAM IS FUN",
  description: "이용자들이 직접 만든 노노그램(네모로직) 창작 퍼즐 전체 목록입니다. 원하는 크기와 그림을 골라 무료로 플레이해보세요.",
  openGraph: {
    title: "퍼즐 목록 | NONOGRAM IS FUN",
    description: "이용자들이 직접 만든 노노그램(네모로직) 창작 퍼즐 전체 목록입니다. 원하는 크기와 그림을 골라 무료로 플레이해보세요.",
    url: "https://nonogramisfun.com/all-puzzles",
    siteName: "NONOGRAM IS FUN",
    type: "website",
  },
};

export const revalidate = 30;

export default async function AllPuzzlesPage() {
  const supabase = await createClient();

  // 🌟 관리자 여부와 무관하게 항상 승인된 퍼즐만 서버에서 가져온다 (캐싱 안전).
  // 미승인 퍼즐은 AllPuzzlesClient가 관리자 확인 후 클라이언트에서 별도로 불러온다.
  const { data: puzzles, error } = await supabase
    .from("puzzles")
    .select("*, comments:puzzle_comments(count), likes:puzzle_likes(count)")
    .eq("is_approved", true)
    .order("created_at", { ascending: false });

  if (error) console.error("퍼즐 목록 불러오기 에러:", error);

  return (
    <AllPuzzlesClient initialPuzzles={puzzles || []} />
  );
}