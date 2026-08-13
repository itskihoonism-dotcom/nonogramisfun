import { createClient } from "../../lib/supabaseServer"; 
import AllPuzzlesClient from "../../components/AllPuzzlesClient"; 

export const metadata = {
  title: "퍼즐 목록 | NONOGRAM IS FUN",
};

// 🌟 캐시를 강제로 끄고 매번 최신 퍼즐 데이터를 가져옵니다.
export const dynamic = "force-dynamic";

export default async function AllPuzzlesPage() {
  const supabase = await createClient(); // 🌟 URL과 KEY는 이 안에 내장되어 있습니다.

  // 1. 서버에서 쿠키를 통해 안전하게 유저 정보 가져오기 (getSession 대신 getUser 사용)
  const { data: { user } } = await supabase.auth.getUser();
  let isAdminMode = false;
  
  if (user && user.email) {
    const { data: userData } = await supabase
      .from("user_ids")
      .select("nickname, custom_id")
      .eq("email", user.email)
      .maybeSingle();
      
    const nickname = userData?.nickname || user.user_metadata?.nickname || "익명";
    const customId = userData?.custom_id || user.user_metadata?.custom_id;
    
    isAdminMode = (nickname === "주인장" || customId === "admin");
  }

  // 2. 퍼즐 데이터 가져오기 (관리자면 전부, 일반 유저면 승인된 것만)
 let query = supabase.from("puzzles").select("*, comments:puzzle_comments(count), likes:puzzle_likes(count)").order("created_at", { ascending: false });
  if (!isAdminMode) {
    query = query.eq("is_approved", true);
  }
  
  const { data: puzzles, error } = await query;
  if (error) console.error("퍼즐 목록 불러오기 에러:", error);

  // 🌟 껍데기 UI는 클라이언트 컴포넌트에 다 들어있으므로 데이터만 넘겨줍니다!
  return (
    <AllPuzzlesClient initialPuzzles={puzzles || []} isAdmin={isAdminMode} />
  );
}