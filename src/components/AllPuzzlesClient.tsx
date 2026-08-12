"use client";

import { useState } from "react";
import { createClient } from "../lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Script from "next/script"; // 🌟 추가

// 날짜 포맷 및 N 뱃지 함수
function formatDate(dateStr: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

function isNew(dateStr: string) {
  if (!dateStr) return false;
  return (new Date().getTime() - new Date(dateStr).getTime()) / 3600000 <= 24;
}

export default function AllPuzzlesClient({ initialPuzzles, isAdmin }: { initialPuzzles: any[], isAdmin: boolean }) {
  const supabase = createClient();
  const router = useRouter();
  const [puzzles, setPuzzles] = useState(initialPuzzles);

  // 🌟 미니 미리보기 컴포넌트 (캔버스 대신 React에 최적화된 빠르고 가벼운 CSS Grid 사용)
  const MiniPuzzle = ({ width, height, data }: { width: number, height: number, data: number[] }) => {
    if (!data || data.length === 0) return null;
    
    const size = 60; // 최대 60px 크기로 제한
    const cellSize = Math.max(1, Math.floor(size / Math.max(width, height)));
    const gridWidth = width * cellSize;
    const gridHeight = height * cellSize;

    return (
      <div style={{ marginRight: "15px", background: "#fff", border: "1px solid #ccc", padding: "2px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${width}, ${cellSize}px)`, gridTemplateRows: `repeat(${height}, ${cellSize}px)`, width: `${gridWidth}px`, height: `${gridHeight}px` }}>
          {data.map((val, idx) => (
            <div key={idx} style={{ backgroundColor: val === 1 ? "#333" : "transparent" }} />
          ))}
        </div>
      </div>
    );
  };

  // 🌟 관리자 전용: 승인 함수
  const handleApprove = async (e: React.MouseEvent, id: number, title: string) => {
    e.preventDefault(); // 페이지 이동(Link) 차단
    if (!confirm(`'${title}' 퍼즐을 승인하시겠습니까?`)) return;
    
    const { error } = await supabase.from("puzzles").update({ is_approved: true }).eq("id", id);
    if (error) {
      alert("승인 실패: " + error.message);
    } else {
      alert("승인되었습니다.");
      setPuzzles(puzzles.map(p => p.id === id ? { ...p, is_approved: true } : p));
      router.refresh();
    }
  };

  // 🌟 관리자 전용: 삭제 함수
  const handleDelete = async (e: React.MouseEvent, id: number, title: string) => {
    e.preventDefault(); // 페이지 이동(Link) 차단
    if (!confirm(`정말 '${title}' 퍼즐을 영구 삭제하시겠습니까?`)) return;
    
    const { error } = await supabase.from("puzzles").delete().eq("id", id);
    if (error) {
      alert("삭제 실패: " + error.message);
    } else {
      alert("삭제되었습니다.");
      setPuzzles(puzzles.filter(p => p.id !== id));
      router.refresh();
    }
  };

  return (
    <div className="view active" style={{ display: "block", minHeight: "100vh" }}>

      {/* 📢 기기별 맞춤 카카오 애드핏 광고 시작 */}
      <div>
        <div className="ad-pc">
          <ins className="kakao_ad_area" style={{ display: "none" }}
            data-ad-unit="DAN-JpEOwXzUOs9jTxSy" 
            data-ad-width="728" 
            data-ad-height="90"></ins>
        </div>

        <div className="ad-mobile">
          <ins className="kakao_ad_area" style={{ display: "none" }}
            data-ad-unit="DAN-sA8hy7KHOiESBxQC" 
            data-ad-width="320" 
            data-ad-height="100"></ins>
        </div>
        
        {/* 🌟 Next.js 방식의 카카오 애드핏 스크립트 실행 */}
        <Script type="text/javascript" src="//t1.kakaocdn.net/kas/static/ba.min.js" strategy="lazyOnload" />
      </div>
      {/* 📢 카카오 애드핏 광고 끝 */}


      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #222", marginBottom: "25px", paddingBottom: "12px" }}>
  <h2 style={{ margin: 0, fontSize: "18px", color: "#111" }}>
    전체 퍼즐 목록
  </h2>
  
  <Link href="/make-puzzle" style={{ backgroundColor: "#2196F3", color: "white", padding: "8px 16px", borderRadius: "4px", textDecoration: "none", fontSize: "14px", fontWeight: "bold", cursor: "pointer" }}>
    + 직접 퍼즐 만들기
  </Link>
</div>

      <ul style={{ listStyle: "none", padding: 0, width: "100%", margin: 0 }}>
        {puzzles.length === 0 ? (
          <li style={{ background: "#fff", padding: "40px", textAlign: "center", borderRadius: "6px", border: "1px solid #e0e0e0", color: "#999" }}>
            등록된 퍼즐이 없습니다.
          </li>
        ) : (
          puzzles.map(p => (
            <li key={p.id} style={{ background: "#fff", marginBottom: "10px", padding: 0, borderRadius: "6px", display: "flex", border: "1px solid #e0e0e0", transition: "background 0.2s", alignItems: "center" }}>
              
              <Link href={`/play-puzzle?id=${p.id}`} style={{ display: "flex", flex: 1, justifyContent: "space-between", alignItems: "center", padding: "15px", textDecoration: "none", color: "inherit", minWidth: 0 }}>
                
                <div style={{ display: "flex", alignItems: "center", minWidth: 0, flex: 1 }}>
                  
                  {/* 🌟 관리자(주인장)일 경우에만 미니 미리보기 썸네일 노출! */}
                  {isAdmin && <MiniPuzzle width={p.width} height={p.height} data={p.data} />}
                  
                  <div className="puzzle-info" style={{ display: "flex", flexDirection: "column", textAlign: "left", minWidth: 0 }}>
                    <span className="puzzle-title" style={{ fontSize: "16px", fontWeight: "bold", color: "#222" }}>
                      
                      {/* 🌟 미승인 뱃지 (관리자에게만 보임) */}
                      {!p.is_approved && <span style={{ background: "#f44336", color: "white", fontSize: "11px", padding: "3px 6px", borderRadius: "3px", marginRight: "6px", verticalAlign: "middle" }}>미승인</span>}
                      
                      {isNew(p.created_at) && <span style={{ backgroundColor: "#ff5722", color: "white", fontSize: "11px", fontWeight: "bold", padding: "3px 6px", borderRadius: "3px", marginRight: "6px", verticalAlign: "middle" }}>N</span>}
                      
                      {p.title} <span style={{ fontWeight: "normal", fontSize: "14px", color: "#666" }}>({p.width}x{p.height})</span>
                    </span>
                    <span className="puzzle-date" style={{ fontSize: "13px", color: "#888", marginTop: "6px" }}>
                      {formatDate(p.created_at)} | 👤 {p.author || '익명'} | 조회 {p.views || 0}
                    </span>
                  </div>
                </div>

                <div className="btn-group" style={{ display: "flex", gap: "5px", flexShrink: 0, alignItems: "center" }}>
                  <button style={{ padding: "8px 15px", border: "none", borderRadius: "4px", color: "#fff", fontSize: "14px", fontWeight: "bold", cursor: "pointer", backgroundColor: "#2196F3", pointerEvents: "none" }}>시작</button>
                </div>
              </Link>

              {/* 🌟 관리자(주인장) 전용 승인 / 삭제 버튼! */}
              {isAdmin && (
                <div style={{ display: "flex", gap: "5px", paddingRight: "15px", zIndex: 10 }}>
                  {!p.is_approved && (
                    <button onClick={(e) => handleApprove(e, p.id, p.title)} style={{ padding: "8px 12px", border: "none", borderRadius: "4px", color: "#fff", fontSize: "13px", fontWeight: "bold", cursor: "pointer", backgroundColor: "#4CAF50" }}>승인</button>
                  )}
                  <button onClick={(e) => handleDelete(e, p.id, p.title)} style={{ padding: "8px 12px", border: "none", borderRadius: "4px", color: "#fff", fontSize: "13px", fontWeight: "bold", cursor: "pointer", backgroundColor: "#f44336" }}>삭제</button>
                </div>
              )}

            </li>
          ))
        )}
      </ul>
    </div>
  );
}