"use client";

import { useState, useEffect, use } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import TiptapEditor from "@/components/TiptapEditor";
import { sanitizeContent } from "@/lib/sanitize";

export default function EditPuzzleContentPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const supabase = createClient();
  const { id } = use(params);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [puzzle, setPuzzle] = useState<any>(null);
  const [content, setContent] = useState("");
    const [isHtmlMode, setIsHtmlMode] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("로그인이 필요합니다.");
        return router.push("/");
      }

      const { data: userData } = await supabase.from("user_ids").select("nickname, custom_id").eq("email", user.email).maybeSingle();
      const nickname = userData?.nickname || user.user_metadata?.nickname || "";
      const isAdmin = nickname === "주인장" || userData?.custom_id === "admin";

      const { data: p, error } = await supabase.from("puzzles").select("*").eq("id", id).single();
      if (error || !p) {
        alert("존재하지 않는 퍼즐입니다.");
        return router.push("/all-puzzles");
      }

      if (p.author !== nickname && !isAdmin) {
        alert("이 퍼즐을 수정할 권한이 없습니다.");
        return router.push(`/puzzle/${p.slug}`);
      }

setPuzzle(p);
setContent(sanitizeContent(p.content) || "");
setIsHtmlMode(p.is_html_mode || false);
      setIsLoading(false);
    };
    fetchData();
  }, [id, router]);

  const handleSave = async () => {
    setIsSaving(true);
    const { error } = await supabase.from("puzzles").update({ content, is_html_mode: isHtmlMode }).eq("id", id);
    setIsSaving(false);

    if (error) {
      alert("저장 실패: " + error.message);
    } else {
      alert("저장되었습니다!");
      router.push(`/puzzle/${puzzle.slug}`);
      router.refresh();
    }
  };

  if (isLoading) return <div style={{ padding: "40px", textAlign: "center" }}>불러오는 중입니다...</div>;

  return (
    <div className="view active">
      <div className="header-title-bar" style={{ borderBottom: "2px solid #111", paddingBottom: "15px", marginBottom: "20px" }}>
        <h2 style={{ fontSize: "24px", fontWeight: "bold", margin: 0 }}>퍼즐 설명 수정</h2>
      </div>

      <div className="write-container">
        <div className="write-group">
          <label>퍼즐 제목</label>
          <div style={{ padding: "14px", background: "#f5f5f5", borderRadius: "6px", fontSize: "15px", color: "#555" }}>
            {puzzle.title} ({puzzle.width}x{puzzle.height})
          </div>
        </div>

        <div className="write-group">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <label>그림 설명</label>
            <label style={{ fontSize: "13px", color: "#555", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}>
              <input type="checkbox" checked={isHtmlMode} onChange={(e) => setIsHtmlMode(e.target.checked)} />
              HTML 모드
            </label>
          </div>
          {isHtmlMode ? (
            <textarea
              style={{ width: "100%", height: "300px", fontFamily: "monospace", fontSize: "14px", background: "#222", color: "#0f0", boxSizing: "border-box", padding: "14px", border: "1px solid #ddd", borderRadius: "6px" }}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          ) : (
            <TiptapEditor content={content} onChange={setContent} />
          )}
        </div>

        <div className="write-buttons">
          <button className="btn-submit-new" onClick={handleSave} disabled={isSaving}>{isSaving ? "저장 중..." : "저장하기"}</button>
          <button className="btn-cancel-new" onClick={() => router.push(`/puzzle/${puzzle.slug}`)}>취소</button>
        </div>
      </div>
    </div>
  );
}