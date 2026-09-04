"use client";

import { useState, useEffect, use } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import KakaoAd from "@/components/KakaoAd";
import TiptapEditor from "@/components/TiptapEditor";
import { sanitizeContent } from "@/lib/sanitize";

export default function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const supabase = createClient();

  const resolvedParams = use(params);
  const postId = resolvedParams.id;

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("잡담");
  const [content, setContent] = useState("");
  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const [uploadedInlineImages, setUploadedInlineImages] = useState<string[]>([]);

  useEffect(() => {
    const fetchPostData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("로그인이 필요합니다.");
        return router.push("/community");
      }

      const { data: userData } = await supabase.from("user_ids").select("nickname, custom_id").eq("email", user.email).maybeSingle();
      const nickname = userData?.nickname || user.user_metadata?.nickname || "익명";
      const isAdmin = nickname === "주인장" || userData?.custom_id === "admin";
      setCurrentUser({ nickname, isAdmin });

      const { data: post, error } = await supabase.from("community_posts").select("*").eq("id", postId).single();
      if (error || !post) {
        alert("존재하지 않거나 삭제된 게시글입니다.");
        return router.push("/community");
      }

      if (post.author !== nickname && !isAdmin) {
        alert("글을 수정할 권한이 없습니다.");
        return router.push(`/community/${postId}`);
      }

setTitle(post.title);
setCategory(post.category);
setContent(sanitizeContent(post.content));
setIsHtmlMode(post.is_html_mode || false);


      setIsLoading(false);
    };
    fetchPostData();
  }, [postId, router]);




  const extractStoragePath = (url: string) => {
    const marker = "community_images/";
    const idx = url.indexOf(marker);
    return idx === -1 ? null : url.slice(idx + marker.length);
  };

  const handleUpdate = async () => {
    if (!title.trim() || !content.trim()) return alert("제목과 내용을 입력해주세요.");
    setIsSaving(true);

    const { error } = await supabase.from("community_posts").update({
      category: category,
      title: title,
      content: content,
      is_notice: category === "공지사항",
      is_html_mode: isHtmlMode
    }).eq("id", postId);

    setIsSaving(false);

    if (error) {
      alert("수정 실패: " + error.message);
    } else {
      alert("게시글이 성공적으로 수정되었습니다!");
      router.push(`/community/${postId}`);
      router.refresh();
    }
  };

  const handleCancel = async () => {
    if (uploadedInlineImages.length > 0) {
      const filePaths = uploadedInlineImages.map(extractStoragePath).filter((p): p is string => !!p);
      if (filePaths.length > 0) {
        const { error } = await supabase.storage.from("community_images").remove(filePaths);
        if (error) console.error("본문 이미지 정리 실패:", error);
      }
    }
    router.push(`/community/${postId}`);
  };

  if (isLoading) return <div style={{ padding: "40px", textAlign: "center" }}>게시글 데이터를 불러오는 중...</div>;

  return (
    <div className="view active">
      <div style={{ marginTop: "15px", marginBottom: "15px" }}>
        <div className="ad-pc">
          <KakaoAd unit="DAN-61T83j6HkgDDyPRJ" width="728" height="90" />
        </div>
        <div className="ad-mobile">
          <KakaoAd unit="DAN-q2LTq4MFcYdFmszx" width="320" height="100" />
        </div>
      </div>

      <div className="header-title-bar" style={{ borderBottom: "2px solid #111", paddingBottom: "15px", marginBottom: "20px" }}>
        <h2 style={{ fontSize: "24px", fontWeight: "bold", margin: 0 }}>글 수정하기</h2>
      </div>

      <div className="write-container">

        {!isPreviewMode ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div className="write-group">
              <label>카테고리 <span style={{ color: "#ff6d00" }}>*</span></label>
              <select className="write-input" style={{ maxWidth: "200px" }} value={category} onChange={(e) => setCategory(e.target.value)}>
                {currentUser?.isAdmin && <option value="공지사항" style={{ color: "red", fontWeight: "bold" }}>🚨 공지사항</option>}
                <option value="유머">유머</option>
                <option value="이슈">이슈</option>
                <option value="잡담">잡담</option>
                <option value="문의">문의</option>
              </select>
            </div>

            <div className="write-group">
              <label>제목 <span style={{ color: "#ff6d00" }}>*</span></label>
              <input type="text" className="write-input" placeholder="제목을 입력하세요" value={title} onChange={(e) => setTitle(e.target.value)} />
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
                <TiptapEditor content={content} onChange={setContent} onImageUpload={(url) => setUploadedInlineImages((prev) => [...prev, url])} />
              )}
            </div>



          </div>
        ) : (
          <div id="preview-area" style={{ border: "2px solid #2196F3", padding: "30px", borderRadius: "8px", background: "#fafafa", boxShadow: "inset 0 0 15px rgba(0,0,0,0.03)" }}>
            <div style={{ borderBottom: "1px solid #ddd", paddingBottom: "15px", marginBottom: "20px" }}>
              <span style={{ color: "#2196F3", fontWeight: "bold", marginRight: "10px", fontSize: "16px" }}>[{category}]</span>
              <h3 style={{ margin: 0, display: "inline-block", fontSize: "22px", color: "#111" }}>{title || '제목이 없습니다'}</h3>
            </div>

            <div className="read-content" style={{ padding: 0, minHeight: "200px" }} dangerouslySetInnerHTML={{ __html: sanitizeContent(content) }} />


          </div>
        )}

        <div className="write-buttons" style={{ display: "flex", justifyContent: "center", gap: "12px", marginTop: "30px", paddingBottom: "30px" }}>
          <button
            type="button"
            className="btn-cancel-new"
            style={{ backgroundColor: isPreviewMode ? "#999" : "#4CAF50", color: "white", padding: "14px 40px", fontSize: "16px", fontWeight: "bold", border: "none", borderRadius: "6px", cursor: "pointer" }}
            onClick={() => setIsPreviewMode(!isPreviewMode)}
          >
            {isPreviewMode ? "✏️ 수정 계속하기" : "👀 미리보기"}
          </button>
          <button
            type="button"
            className="btn-submit-new"
            style={{ backgroundColor: "#ff6d00", color: "white", padding: "14px 40px", fontSize: "16px", fontWeight: "bold", border: "none", borderRadius: "6px", cursor: "pointer" }}
            onClick={handleUpdate}
            disabled={isSaving}
          >
            {isSaving ? "수정 중..." : "수정 완료"}
          </button>
          <button
            type="button"
            className="btn-cancel-new"
            style={{ backgroundColor: "#333", color: "white", padding: "14px 40px", fontSize: "16px", fontWeight: "bold", border: "none", borderRadius: "6px", cursor: "pointer" }}
            onClick={handleCancel}
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}