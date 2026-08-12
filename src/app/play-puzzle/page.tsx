import { createClient } from "../../lib/supabaseServer";
import Link from "next/link";
import PlayPuzzleClient from "../../components/PlayPuzzleClient";
import KakaoAd from "../../components/KakaoAd";

export const metadata = {
  title: "퍼즐 플레이 | NONOGRAM IS FUN",
};

export const dynamic = "force-dynamic";


export default async function PlayPuzzlePage({ searchParams }: { searchParams: any }) {
  const resolvedParams = await Promise.resolve(searchParams);
  const id = resolvedParams?.id; // 🌟 title 대신 id를 받습니다.

  if (!id) {
    return <div style={{ padding: "50px", textAlign: "center" }}>잘못된 접근입니다.</div>;
  }




  
  const supabase = await createClient();

  // 1. 퍼즐 데이터 불러오기 (id 기준)
  const { data: puzzle, error } = await supabase.from("puzzles").select("*").eq("id", id).single();

  if (error || !puzzle) {
    return <div style={{ padding: "50px", textAlign: "center" }}>퍼즐을 찾을 수 없습니다.</div>;
  }

  // 2. 조회수 +1 증가시키기 (id 기준)
  await supabase.from("puzzles").update({ views: (puzzle.views || 0) + 1 }).eq("id", id);

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


      <div className="section-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", margin: "0 0 15px 0", borderBottom: "1px solid #eee", paddingBottom: "10px" }}>
        <h2 style={{ margin: 0, fontSize: "18px", color: "#111" }}>
          {puzzle.title} ({puzzle.width}x{puzzle.height})
        </h2>
        <Link href="/all-puzzles" style={{ background: "none", border: "none", color: "#f44336", fontWeight: "bold", cursor: "pointer", textDecoration: "none", fontSize: "14px" }}>
          ❮ 목록으로
        </Link>
      </div>

      <PlayPuzzleClient puzzle={puzzle} />
    </div>
  );
}