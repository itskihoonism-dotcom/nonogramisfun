"use client";

import { useState, useEffect } from "react";
import { createClient } from "../lib/supabaseClient";
import { useRouter } from "next/navigation";
import Script from "next/script";

export default function NoticeClient({
  initialNotices,
  isAdmin,
  targetId,
}: {
  initialNotices: any[];
  isAdmin: boolean;
  targetId: number | null;
}) {
  const supabase = createClient();
  const router = useRouter();

  // 상태 관리
  const [openId, setOpenId] = useState<number | null>(targetId);
  const [isWriteMode, setIsWriteMode] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  // targetId가 있으면 해당 공지사항으로 스크롤 부드럽게 이동
  useEffect(() => {
    if (targetId) {
      const el = document.getElementById(`notice-${targetId}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [targetId]);

  // 글쓰기 창 열기/초기화
  const handleOpenWriteMode = () => {
    setEditingId(null);
    setTitle("");
    setContent("");
    setIsWriteMode(true);
  };

  const handleCancelWrite = () => {
    setIsWriteMode(false);
    setEditingId(null);
    setTitle("");
    setContent("");
  };

  // 수정 모드 열기
  const handleEdit = (e: React.MouseEvent, notice: any) => {
    e.stopPropagation();
    setEditingId(notice.id);
    setTitle(notice.title);
    setContent(notice.content);
    setIsWriteMode(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 등록 및 수정 저장
  const handleSave = async () => {
    if (!title.trim() || !content.trim()) return alert("제목과 내용을 모두 입력하세요.");
    
    let error;
    if (editingId) {
      const res = await supabase.from("notices").update({ title, content }).eq("id", editingId);
      error = res.error;
    } else {
      const res = await supabase.from("notices").insert([{ title, content }]);
      error = res.error;
    }

    if (error) {
      alert("저장 실패: " + error.message);
    } else {
      alert(editingId ? "성공적으로 수정되었습니다." : "공지사항이 등록되었습니다.");
      setIsWriteMode(false);
      router.refresh(); // 서버 데이터 새로고침
    }
  };

  // 삭제
  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!confirm("정말 이 공지사항을 삭제하시겠습니까?")) return;
    
    const { error } = await supabase.from("notices").delete().eq("id", id);
    if (error) alert("삭제 실패: " + error.message);
    else {
      alert("삭제되었습니다.");
      router.refresh();
    }
  };

  // 날짜 변환 함수
  const formatDate = (dateString: string) => {
    return dateString.split("T")[0].replace(/-/g, ".");
  };

  return (
    <>
      <style>{`
        /* 애드핏 설정 */
        .ad-pc { display: block; text-align: center; margin-bottom: 20px; }
        .ad-mobile { display: none; text-align: center; margin-bottom: 20px; }
        @media (max-width: 768px) {
          .ad-pc { display: none; }
          .ad-mobile { display: block; }
        }

        /* 아코디언 스타일 */
        .accordion { border: 1px solid #ddd; border-radius: 6px; overflow: hidden; }
        .accordion-item { border-bottom: 1px solid #eee; }
        .accordion-item:last-child { border-bottom: none; }
        .accordion-header { padding: 18px 20px; cursor: pointer; background: #fff; font-size: 15px; display: flex; justify-content: space-between; align-items: center; transition: background 0.2s; }
        .accordion-header:hover { background: #f4f8fb; }
        .accordion-header.active { background: #e3f2fd; font-weight: bold; }
        .accordion-title { display: flex; align-items: center; gap: 10px; }
        .notice-badge { background: #f44336; color: white; font-size: 11px; font-weight: bold; padding: 3px 8px; border-radius: 4px; }
        .accordion-date { font-size: 13px; color: #888; font-weight: normal; }
        .accordion-content { padding: 25px 20px; background: #fafafa; font-size: 15px; line-height: 1.7; color: #333; border-top: 1px solid #eee; white-space: pre-wrap; }
      `}</style>

      {/* 📢 기기별 맞춤 카카오 애드핏 광고 시작 */}
      <div>
        <div className="ad-pc">
          <ins className="kakao_ad_area" style={{ display: "none" }} data-ad-unit="DAN-r7UxzhMfPVZQilVh" data-ad-width="728" data-ad-height="90"></ins>
        </div>
        <div className="ad-mobile">
          <ins className="kakao_ad_area" style={{ display: "none" }} data-ad-unit="DAN-8gBtol149cRHiI4x" data-ad-width="320" data-ad-height="100"></ins>
        </div>
        <Script type="text/javascript" src="//t1.kakaocdn.net/kas/static/ba.min.js" strategy="lazyOnload" />
      </div>
      {/* 📢 카카오 애드핏 광고 끝 */}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #222", marginBottom: "25px", paddingBottom: "12px" }}>
        <h2 style={{ margin: 0, fontSize: "22px", color: "#111", display: "flex", alignItems: "center", gap: "10px" }}>📢 공지사항</h2>
        
        {isAdmin && (
          <button onClick={handleOpenWriteMode} style={{ background: "#4CAF50", color: "white", border: "none", padding: "8px 15px", borderRadius: "4px", fontWeight: "bold", cursor: "pointer" }}>
            + 공지 작성
          </button>
        )}
      </div>

      {/* 관리자 글쓰기/수정 영역 */}
      {isAdmin && isWriteMode && (
        <div style={{ background: "#f9f9f9", padding: "20px", borderRadius: "8px", marginBottom: "20px", border: "1px solid #ddd" }}>
          <input 
            type="text" 
            placeholder="공지사항 제목을 입력하세요" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)}
            style={{ width: "100%", padding: "12px", marginBottom: "10px", boxSizing: "border-box", border: "1px solid #ccc", borderRadius: "4px" }} 
          />
          <textarea 
            placeholder="공지 내용을 입력하세요" 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            style={{ width: "100%", height: "150px", padding: "12px", marginBottom: "10px", boxSizing: "border-box", border: "1px solid #ccc", borderRadius: "4px", resize: "vertical" }} 
          />
          <div style={{ textAlign: "right", gap: "10px", display: "flex", justifyContent: "flex-end" }}>
            <button onClick={handleCancelWrite} style={{ padding: "10px 20px", cursor: "pointer", background: "#ccc", border: "none", borderRadius: "4px", color: "#333", fontWeight: "bold" }}>취소</button>
            <button onClick={handleSave} style={{ padding: "10px 20px", background: "#2196F3", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>
              {editingId ? "수정하기" : "등록하기"}
            </button>
          </div>
        </div>
      )}

      {/* 공지사항 리스트 영역 (아코디언) */}
      <div className="accordion">
        {initialNotices.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#999" }}>등록된 공지사항이 없습니다.</div>
        ) : (
          initialNotices.map((notice) => {
            const isOpen = openId === notice.id;
            return (
              <div key={notice.id} className="accordion-item" id={`notice-${notice.id}`}>
                <div 
                  className={`accordion-header ${isOpen ? "active" : ""}`} 
                  onClick={() => setOpenId(isOpen ? null : notice.id)}
                >
                  <div className="accordion-title">
                    <span className="notice-badge">공지</span> 
                    {notice.title} 
                    {isAdmin && (
                      <>
                        <button onClick={(e) => handleEdit(e, notice)} style={{ background: "#2196F3", color: "white", border: "none", padding: "4px 8px", borderRadius: "4px", marginLeft: "10px", fontSize: "11px", fontWeight: "bold", cursor: "pointer" }}>수정</button>
                        <button onClick={(e) => handleDelete(e, notice.id)} style={{ background: "#f44336", color: "white", border: "none", padding: "4px 8px", borderRadius: "4px", marginLeft: "5px", fontSize: "11px", fontWeight: "bold", cursor: "pointer" }}>삭제</button>
                      </>
                    )}
                  </div>
                  <span className="accordion-date">{formatDate(notice.created_at)}</span>
                </div>
                {isOpen && (
                  <div className="accordion-content" style={{ display: "block" }}>
                    {notice.content}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </>
  );
}