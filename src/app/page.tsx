import { createClient } from "../lib/supabaseServer";
import Link from "next/link";
import MainClientArea from "../components/MainClientArea";
import KakaoAd from "../components/KakaoAd";

export const dynamic = "force-dynamic";

// 날짜 포맷 함수
function formatDate(dateStr: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

// 24시간 이내 'N' 뱃지 표시 여부
function isNew(dateStr: string) {
  if (!dateStr) return false;
  return (new Date().getTime() - new Date(dateStr).getTime()) / 3600000 <= 24;
}

export default async function HomePage() {
  const supabase = await createClient(); // 🌟 괄호 안을 비우고 await 추가!

  // 🌟 서버에서 데이터 가져오기
  const [puzzlesRes, commRes] = await Promise.all([
    supabase
      .from('puzzles')
      // 👇 다시 'id'를 불러오도록 부활시켰습니다!
      .select('id, title, width, height, created_at, author, views')
      .eq('is_approved', true)
      .order('created_at', { ascending: false })
      .limit(6),
    supabase
      .from('community_posts')
      .select('id, title, author, category, created_at, comments')
      .order('created_at', { ascending: false })
      .limit(6)
  ]);

  const pData = puzzlesRes.data || [];
  const cData = commRes.data || [];

  return (
    <div className="view active" style={{ display: "block", minHeight: "100vh" }}>

      
      {/* 📢 기기별 맞춤 카카오 애드핏 광고 시작 (새 부품 적용 완료!) */}
      <div style={{ marginTop: "15px", marginBottom: "15px" }}>
        <div className="ad-pc">
          <KakaoAd unit="DAN-O2E3DDgytFclBz0h" width="728" height="90" />
        </div>

        <div className="ad-mobile">
          <KakaoAd unit="DAN-sLAHjYV35LtARQ77" width="320" height="100" />
        </div>
      </div>
      {/* 📢 카카오 애드핏 광고 끝 */}
      
      {/* 로그인 체크 후 페이지를 이동시키는 클라이언트 부품 (퍼즐 만들기 버튼) */}
      <MainClientArea />

      <div className="home-split-layout" style={{ display: "flex", gap: "25px", width: "100%", alignItems: "flex-start", flexWrap: "wrap" }}>
        
        {/* 🧩 1. 퍼즐 목록 (왼쪽) */}
        <div className="home-split-column" style={{ flex: "1 1 300px", minWidth: 0, display: "flex", flexDirection: "column" }}>
          <div className="section-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", margin: "0 0 10px 0", borderBottom: "1px solid #eee", paddingBottom: "10px" }}>
            <h2 style={{ margin: 0, fontSize: "18px", color: "#111" }}>퍼즐 목록</h2>
            <Link href="/all-puzzles" style={{ background: "none", fontSize: "14px", border: "none", color: "#2196F3", fontWeight: "bold", cursor: "pointer", textDecoration: "none" }}>전체보기 ➡️</Link>
          </div>
          <ul id="board-list" style={{ listStyle: "none", padding: 0, width: "100%", margin: 0, minHeight: "250px" }}>
            {pData.length === 0 ? (
              <li style={{ background: "#fff", marginBottom: "8px", padding: "15px", borderRadius: "6px", display: "flex", justifyContent: "center", alignItems: "center", border: "1px solid #e0e0e0", color: "#999" }}>퍼즐이 없습니다.</li>
            ) : (
              pData.map(p => (
                // 👇 key를 p.id로 변경
                <li key={p.id} style={{ background: "#fff", marginBottom: "8px", padding: 0, borderRadius: "6px", display: "flex", border: "1px solid #e0e0e0", transition: "background 0.2s" }}>
                  {/* 👇 링크 주소를 ?title=... 에서 ?id=... 로 변경! */}
                  <Link href={`/play-puzzle?id=${p.id}`} style={{ display: "flex", flex: 1, justifyContent: "space-between", alignItems: "center", padding: "15px", textDecoration: "none", color: "inherit", minWidth: 0 }}>
                    <div className="puzzle-info" style={{ display: "flex", flexDirection: "column", textAlign: "left", minWidth: 0, flex: 1, paddingRight: "10px" }}>
                      <span className="puzzle-title" style={{ fontSize: "14px", fontWeight: "bold", color: "#222", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {isNew(p.created_at) && <span style={{ backgroundColor: "#ff5722", color: "white", fontSize: "10px", fontWeight: "bold", padding: "2px 6px", borderRadius: "3px", marginRight: "6px", verticalAlign: "middle" }}>N</span>}
                        {p.title} <span style={{ fontWeight: "normal", fontSize: "13px", color: "#666" }}>({p.width}x{p.height})</span>
                      </span>
                      <span className="puzzle-date" style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>
                        {formatDate(p.created_at)} | 👤 {p.author || '익명'} | 조회 {p.views || 0}
                      </span>
                    </div>
                    
                  </Link>
                </li>
              ))
            )}
          </ul>
        </div>

        {/* 💬 2. 커뮤니티 목록 (오른쪽) */}
        <div className="home-split-column" style={{ flex: "1 1 300px", minWidth: 0, display: "flex", flexDirection: "column" }}>
          <div className="section-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", margin: "0 0 10px 0", borderBottom: "1px solid #eee", paddingBottom: "10px" }}>
            <h2 style={{ margin: 0, fontSize: "18px", color: "#111" }}>커뮤니티 최신 글</h2>
            <Link href="/community" style={{ background: "none", border: "none", fontSize: "14px", color: "#2196F3", fontWeight: "bold", cursor: "pointer", textDecoration: "none" }}>전체보기 ➡️</Link>
          </div>
          <ul id="home-community-list" style={{ listStyle: "none", padding: 0, width: "100%", margin: 0, minHeight: "250px" }}>
            {cData.length === 0 ? (
              <li style={{ background: "#fff", marginBottom: "8px", padding: "15px", borderRadius: "6px", display: "flex", justifyContent: "center", alignItems: "center", border: "1px solid #e0e0e0", color: "#999" }}>게시글이 없습니다.</li>
            ) : (
              cData.map(c => (
                <li key={c.id} style={{ background: "#fff", marginBottom: "8px", padding: 0, borderRadius: "6px", display: "flex", border: "1px solid #e0e0e0", transition: "background 0.2s" }}>
                  <Link href={`/community/${c.id}`} style={{ display: "flex", flex: 1, justifyContent: "space-between", alignItems: "center", padding: "15px", textDecoration: "none", color: "inherit", minWidth: 0 }}>
                    <div className="puzzle-info" style={{ display: "flex", flexDirection: "column", textAlign: "left", minWidth: 0, flex: 1, paddingRight: "10px" }}>
                      <span className="puzzle-title" style={{ fontSize: "13px", fontWeight: "bold", color: "#222", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        <span style={{ color: "#9c27b0", fontSize: "12px", marginRight: "4px" }}>[{c.category}]</span>
                        {c.title}
                        {c.comments > 0 && <span style={{ color: "#ff5722", fontWeight: "bold", fontSize: "12px", marginLeft: "4px" }}>[{c.comments}]</span>}
                      </span>
                      <span className="puzzle-date" style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>
                        {formatDate(c.created_at)} | {c.author}
                      </span>
                    </div>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </div>

      </div>

      {/* 🧩 3. 하단 SEO 설명 텍스트 영역 */}
      <div className="seo-content-box" style={{ marginTop: "40px", padding: "20px", background: "#f9f9f9", borderRadius: "8px", border: "1px solid #eee", fontSize: "14px", lineHeight: "1.6", color: "#444" }}>
        <h3 style={{ marginTop: 0, color: "#222", fontSize: "16px", borderBottom: "2px solid #ddd", paddingBottom: "8px" }}>🧩 노노그램(네모로직)이란 무엇인가요?</h3>
        <p>노노그램(Nonogram)은 가로와 세로 축에 적힌 숫자를 힌트 삼아 숨겨진 픽셀 아트를 완성하는 매력적인 논리 퍼즐입니다. 네모로직, 피크로스(Picross), 그리들러(Griddlers) 등 다양한 이름으로 불리며 전 세계적으로 사랑받고 있습니다. 논리적 추론과 공간 지각 능력을 활용해야 하므로, 두뇌 발달은 물론 성인들의 치매 예방과 집중력 향상에도 큰 도움을 줍니다.</p>
        <h3 style={{ marginTop: "20px", color: "#222", fontSize: "16px", borderBottom: "2px solid #ddd", paddingBottom: "8px" }}>💡 노노그램 기본 규칙 및 풀이 방법</h3>
        <p style={{ margin: 0 }}><strong>1. 숫자의 의미:</strong> 각 행과 열에 있는 숫자는 연속으로 칠해져야 하는 칸의 개수를 나타냅니다.<br/><strong>2. 공백의 규칙:</strong> 숫자가 여러 개 있을 경우(예: 3 2), 3칸을 칠하고 최소 1칸 이상의 빈칸을 띄운 다음 2칸을 칠해야 합니다.<br/><strong>3. 엑스(X) 표시 활용:</strong> 절대 칠해질 수 없는 칸이나 빈칸으로 확정된 곳에는 'X' 표시를 해두면 큰 도움이 됩니다.<br/><strong>4. 교차점 찾기:</strong> 가로 힌트와 세로 힌트가 만나는 확실한 교차점부터 시작해보세요.</p>
      </div>

    </div>
  );
}