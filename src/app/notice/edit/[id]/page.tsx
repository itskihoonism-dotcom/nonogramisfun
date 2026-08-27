"use client";

import { useState, useEffect, use } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import TiptapEditor from "@/components/TiptapEditor";

export default function NoticeEditPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const supabase = createClient();
  const resolvedParams = use(params);
  const noticeId = resolvedParams.id;

  const [isLoading, setIsLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("로그인이 필요합니다.");
        return router.push("/notice");
      }
      const { data: userData } = await supabase.from("user_ids").select("nickname, custom_id").eq("email", user.email).maybeSingle();
      const isAdmin = userData?.nickname === "주인장" || userData?.custom_id === "admin";
      if (!isAdmin) {
        alert("공지사항은 관리자만 수정할 수 있습니다.");
        return router.push("/notice");
      }

      const { data: notice, error } = await supabase.from("notices").select("*").eq("id", noticeId).single();
      if (error || !notice) {
        alert("존재하지 않는 공지사항입니다.");
        return router.push("/notice");
      }

      setTitle(notice.title);
      setContent(notice.content);
      setIsHtmlMode(notice.is_html_mode || false);
      setIsLoading(false);
    };
    fetchData();
  }, [noticeId, router]);

  const extractStoragePath = (url: string) => {
    const marker = "/storage/v1/object/public/community_images/";
    const idx = url.indexOf(marker);
    return idx === -1 ? null : decodeURIComponent(url.slice(idx + marker.length));
  };

  const cleanupOrphanImages = async () => {
    const paths = uploadedImages.map(extractStoragePath).filter((p): p is string => !!p);
    if (paths.length > 0) {
      const { error } = await supabase.storage.from("community_images").remove(paths);
      if (error) console.error("이미지 정리 실패:", error);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) return alert("제목과 내용을 입력해주세요.");
    setIsSaving(true);

    const { error } = await supabase.from("notices").update({ title, content, is_html_mode: isHtmlMode }).eq("id", noticeId);

    if (error) {
      alert("수정 실패: " + error.message);
      setIsSaving(false);
      return;
    }

    alert("수정되었습니다!");
    router.push(`/notice/${noticeId}`);
    router.refresh();
  };

  const handleCancel = async () => {
    await cleanupOrphanImages();
    router.push(`/notice/${noticeId}`);
  };

  if (isLoading) return <div style={{ padding: "40px", textAlign: "center" }}>불러오는 중입니다...</div>;

  return (
    <div className="view active">
      <div className="header-title-bar" style={{ borderBottom: "2px solid #111", paddingBottom: "15px", marginBottom: "20px" }}>
        <h2 style={{ fontSize: "24px", fontWeight: "bold", margin: 0 }}>공지사항 수정</h2>
      </div>

      <div className="write-container">
        <div className="write-group">
          <label>제목 <span style={{ color: "#ff6d00" }}>*</span></label>
          <input type="text" className="write-input" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div className="write-group">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <label>내용 <span style={{ color: "#ff6d00" }}>*</span></label>
            <label style={{ fontSize: "13px", color: "#555", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px" }}>
              <input type="checkbox" checked={isHtmlMode} onChange={(e) => setIsHtmlMode(e.target.checked)} />
              HTML 모드
            </label>
          </div>
          {isHtmlMode ? (
            <textarea
              className="write-input"
              style={{ width: "100%", height: "400px", fontFamily: "monospace", fontSize: "14px", background: "#222", color: "#0f0", boxSizing: "border-box" }}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          ) : (
            <TiptapEditor content={content} onChange={setContent} onImageUpload={(url) => setUploadedImages((prev) => [...prev, url])} />
          )}
        </div>

        <div className="write-buttons">
          <button className="btn-submit-new" onClick={handleSubmit} disabled={isSaving}>{isSaving ? "저장 중..." : "저장하기"}</button>
          <button className="btn-cancel-new" onClick={handleCancel}>취소</button>
        </div>
      </div>
    </div>
  );
}