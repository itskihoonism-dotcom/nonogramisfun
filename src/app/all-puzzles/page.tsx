import { createClient } from "../../lib/supabaseServer"; 
import AllPuzzlesClient from "../../components/AllPuzzlesClient"; 

export const metadata = {
  title: "퍼즐 목록 | NONOGRAM IS FUN",
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