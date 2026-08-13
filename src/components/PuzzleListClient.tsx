"use client";

import { useState, useEffect } from "react";
import { createClient } from "../lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";


export default function PuzzleListClient({ initialPuzzles, isAdminMode }: { initialPuzzles: any[], isAdminMode: boolean }) {
  const router = useRouter();
  const supabase = createClient();
  const [completedPuzzleIds, setCompletedPuzzleIds] = useState<any[]>([]);

  useEffect(() => {
    // 🌟 2. DB에서 현재 로그인한 유저의 클리어 기록(puzzle_id)을 실시간으로 가져옴
    const fetchCompletedPuzzles = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase
          .from('completed_puzzles')
          .select('puzzle_id')
          .eq('user_id', session.user.id);

        if (data) {
          setCompletedPuzzleIds(data.map(row => row.puzzle_id));
        }
      }
    };
    fetchCompletedPuzzles();
  }, []);

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
  };

  const isNew = (dateString: string) => {
    if (!dateString) return false;
    return (new Date().getTime() - new Date(dateString).getTime()) / (1000 * 60 * 60) <= 24;
  };

  const handleMakePuzzleClick = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      alert("로그인 후 이용할 수 있습니다.");
    } else {
      router.push("/make-puzzle");
    }
  };

  const handleApprove = async (e: React.MouseEvent, id: string, title: string) => {
    e.preventDefault();
    if (!confirm(`'${title}' 퍼즐을 승인하시겠습니까?`)) return;
    const { error } = await supabase.from("puzzles").update({ is_approved: true }).eq("id", id);
    if (error) alert("승인 실패: " + error.message);
    else { alert("승인되었습니다."); router.refresh(); }
  };

  const handleDelete = async (e: React.MouseEvent, id: string, title: string) => {
    e.preventDefault();
    if (!confirm(`정말 '${title}' 퍼즐을 영구 삭제하시겠습니까?`)) return;
    const { error } = await supabase.from("puzzles").delete().eq("id", id);
    if (error) alert("삭제 실패: " + error.message);
    else { alert("삭제되었습니다."); router.refresh(); }
  };

  return (
    <>
      <div style={{ textAlign: "right", marginBottom: "15px" }}>
        <button 
          onClick={handleMakePuzzleClick}
          style={{ padding: "8px 15px", fontSize: "13px", cursor: "pointer", backgroundColor: "#2196F3", color: "white", border: "none", borderRadius: "4px", fontWeight: "bold" }}
        >
          + 직접 퍼즐 만들기
        </button>
      </div>

      <ul id="all-puzzle-list" style={{ listStyle: "none", padding: 0, width: "100%", margin: 0 }}>
        {initialPuzzles.length === 0 ? (
          <li style={{ justifyContent: "center", color: "#999", padding: "40px 0", textAlign: "center" }}>
            플레이 가능한 퍼즐이 없습니다.
          </li>
        ) : (
          initialPuzzles.map((puzzle) => {
            // 🌟 3. 현재 렌더링 중인 퍼즐 ID가 클리어 목록에 있는지 확인
            const isCleared = completedPuzzleIds.includes(puzzle.id);

            return (
              <li key={puzzle.id} style={{ background: "#fff", marginBottom: "8px", padding: 0, borderRadius: "6px", display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #e0e0e0", transition: "background 0.2s" }}>
                <Link 
                  href={`/play-puzzle?id=${puzzle.id}`}
                  style={{ display: "flex", flex: 1, justifyContent: "space-between", alignItems: "center", padding: "15px", textDecoration: "none", color: "inherit", minWidth: 0 }}
                >
                  <div style={{ display: "flex", flexDirection: "column", textAlign: "left", minWidth: 0, flex: 1, paddingRight: "10px" }}>
                    <span style={{ fontSize: "15px", fontWeight: "bold", color: "#222", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      
                      {!puzzle.is_approved && <span style={{ background: "#f44336", color: "white", fontSize: "10px", padding: "2px 6px", borderRadius: "3px", marginRight: "6px", verticalAlign: "middle" }}>미승인</span>}
                      
                      {/* 🌟 4. 테마 통일성을 위해 초록색 ✅ 뱃지로 교체 */}
                      {isCleared && <span style={{ backgroundColor: "#E8F5E9", color: "#4CAF50", fontSize: "11px", fontWeight: "bold", border: "1px solid #4CAF50", padding: "1px 5px", borderRadius: "3px", marginRight: "5px", verticalAlign: "middle" }}>✅ 완료</span>}
                      
                      {isNew(puzzle.created_at) && <span style={{ backgroundColor: "#ff5722", color: "white", fontSize: "10px", fontWeight: "bold", padding: "2px 6px", borderRadius: "3px", marginRight: "6px", verticalAlign: "middle" }}>N</span>}
                      
                      {puzzle.title} <span style={{ fontWeight: "normal", fontSize: "13px", color: "#666" }}>({puzzle.width}x{puzzle.height})</span>
                    </span>
                    <span style={{ fontSize: "12px", color: "#888", marginTop: "4px" }}>
                      {formatDate(puzzle.created_at)} | 👤 {puzzle.author || "익명"} | 조회 {puzzle.views || 0}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "5px", flexShrink: 0 }}>
                    <button type="button" style={{ padding: "6px 12px", border: "none", borderRadius: "4px", color: "#fff", fontSize: "13px", fontWeight: "bold", backgroundColor: "#2196F3", pointerEvents: "none" }}>
                      시작
                    </button>
                  </div>
                </Link>
                
                {isAdminMode && (
                  <div style={{ display: "flex", gap: "5px", flexShrink: 0, paddingRight: "15px", position: "relative", zIndex: 10 }}>
                    {!puzzle.is_approved && (
                      <button onClick={(e) => handleApprove(e, puzzle.id, puzzle.title)} style={{ padding: "6px 12px", border: "none", borderRadius: "4px", color: "#fff", fontSize: "13px", fontWeight: "bold", cursor: "pointer", backgroundColor: "#4CAF50" }}>
                        승인
                      </button>
                    )}
                    <button onClick={(e) => handleDelete(e, puzzle.id, puzzle.title)} style={{ padding: "6px 12px", border: "none", borderRadius: "4px", color: "#fff", fontSize: "13px", fontWeight: "bold", cursor: "pointer", backgroundColor: "#f44336" }}>
                      삭제
                    </button>
                  </div>
                )}
              </li>
            );
          })
        )}
      </ul>
    </>
  );
}