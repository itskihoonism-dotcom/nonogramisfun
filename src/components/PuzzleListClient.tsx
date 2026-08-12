"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import Link from "next/link";

const SUPABASE_URL = "https://jxwhdiwwgtnyyqenkpvw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4d2hkaXd3Z3RueXlxZW5rcHZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwMDQ3NjgsImV4cCI6MjEwMTU4MDc2OH0.e76mCgwu-v8W-cuu3fR4_4jQ9gwP60MCCESzAgoBQaU";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function PuzzleListClient({ initialPuzzles, isAdminMode }: { initialPuzzles: any[], isAdminMode: boolean }) {
  const router = useRouter();
  const [completedPuzzles, setCompletedPuzzles] = useState<string[]>([]);

  useEffect(() => {
    // 🌟 로컬 스토리지에서 내 클리어 기록을 불러옵니다.
    const stored = JSON.parse(localStorage.getItem("completed_nonograms") || "[]");
    setCompletedPuzzles(stored);
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

  // 🌟 id 기준으로 데이터베이스를 조작하도록 변경
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
          initialPuzzles.map((puzzle) => (
            <li key={puzzle.id} style={{ background: "#fff", marginBottom: "8px", padding: 0, borderRadius: "6px", display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid #e0e0e0", transition: "background 0.2s" }}>
              <Link 
                href={`/play-puzzle?id=${puzzle.id}`}
                style={{ display: "flex", flex: 1, justifyContent: "space-between", alignItems: "center", padding: "15px", textDecoration: "none", color: "inherit", minWidth: 0 }}
              >
                <div style={{ display: "flex", flexDirection: "column", textAlign: "left", minWidth: 0, flex: 1, paddingRight: "10px" }}>
                  <span style={{ fontSize: "15px", fontWeight: "bold", color: "#222", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {!puzzle.is_approved && <span style={{ background: "#f44336", color: "white", fontSize: "10px", padding: "2px 6px", borderRadius: "3px", marginRight: "6px", verticalAlign: "middle" }}>미승인</span>}
                    {completedPuzzles.includes(puzzle.title) && <span style={{ color: "#4CAF50", marginRight: "5px" }}>✔</span>}
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
              
              {/* 🌟 관리자 전용 승인/삭제 버튼 */}
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
          ))
        )}
      </ul>
    </>
  );
}