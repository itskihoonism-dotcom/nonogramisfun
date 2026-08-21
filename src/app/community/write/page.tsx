"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import KakaoAd from "@/components/KakaoAd";
import TiptapEditor from "@/components/TiptapEditor";

export default function WritePage() {
  const router = useRouter();
  const supabase = createClient();

  const [currentUser, setCurrentUser] = useState<any>(null);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("잡담");
  const [content, setContent] = useState("");
  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  const [tempFiles, setTempFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("로그인이 필요합니다.");
        return router.push("/community");
      }

      const { data: userData } = await supabase.from("user_ids").select("nickname, custom_id").eq("email", user.email).maybeSingle();
      const nickname = userData?.nickname || user.user_metadata?.nickname || "익명";
      const isAdmin = nickname === "주인장" || userData?.custom_id === "admin";
      setCurrentUser({ email: user.email, nickname, isAdmin });
    };
    checkAuth();
  }, [router]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (tempFiles.length + files.length > 5) {
      alert("이미지는 최대 5장까지 첨부 가능합니다.");
      return;
    }

    const validFiles = files.filter(f => {
      if (f.size > 2 * 1024 * 1024) {
        alert(`${f.name} 파일은 2MB를 초과하여 제외되었습니다.`);
        return false;
      }
      return true;
    });

    const newFiles = [...tempFiles, ...validFiles];
    setTempFiles(newFiles);
    setPreviewUrls(newFiles.map(file => URL.createObjectURL(file)));
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    const newFiles = tempFiles.filter((_, i) => i !== index);
    setTempFiles(newFiles);
    setPreviewUrls(newFiles.map(file => URL.createObjectURL(file)));
  };

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

    let uploadedImageUrls: string[] = [];
    if (tempFiles.length > 0) {
      for (const file of tempFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `post_images/${fileName}`;

        const { error: uploadError } = await supabase.storage.from("community_images").upload(filePath, file);
        if (uploadError) {
          console.error("이미지 업로드 에러:", uploadError);
          continue;
        }

        const { data: publicUrlData } = supabase.storage.from("community_images").getPublicUrl(filePath);
        if (publicUrlData) uploadedImageUrls.push(publicUrlData.publicUrl);
      }
    }

    const imageStr = uploadedImageUrls.length > 0 ? JSON.stringify(uploadedImageUrls) : null;

    const { error } = await supabase.from("community_posts").insert([{
      category: category,
      title: title,
      content: content,
      author: currentUser.nickname,
      image: imageStr,
      is_notice: category === "공지사항",
      is_html_mode: isHtmlMode,
      views: 0,
      comments: 0,
      likes: 0,
      dislikes: 0
    }]);

    if (error) {
      alert("등록 실패: " + error.message);
      setIsSaving(false);
      return;
    }

    try {
      const { data: userData } = await supabase.from("user_ids").select("points").eq("email", currentUser.email).maybeSingle();
      const currentPoints = userData?.points || 0;
      await supabase.from("user_ids").update({ points: currentPoints + 10 }).eq("email", currentUser.email);
    } catch (pointError) {
      console.error("포인트 지급 에러:", pointError);
    }

    alert("게시글이 성공적으로 등록되었습니다! (+10 포인트 획득)");
    router.push("/community");
    router.refresh();
  };

  const handleCancel = async () => {
    await cleanupOrphanImages();
    router.push("/community");
  };

  if (!currentUser) return <div style={{ padding: "40px", textAlign: "center" }}>인증 정보를 확인 중입니다...</div>;

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
        <h2 style={{ fontSize: "24px", fontWeight: "bold", margin: 0 }}>새 글 쓰기</h2>
      </div>

      <div className="write-container">
        {!isPreviewMode ? (
          <div id="write-inputs-area" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
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
                <TiptapEditor content={content} onChange={setContent} onImageUpload={(url) => setUploadedImages((prev) => [...prev, url])} />
              )}
            </div>

            <div className="write-group" style={{ marginTop: "15px" }}>
              <label>파일 첨부</label>
              <div className="file-upload-box" style={{ border: "1px solid #ddd", background: "#f9f9f9", padding: "20px", borderRadius: "6px" }}>
                <div className="file-row" style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                  <label style={{ background: "#333", color: "#ffffff", padding: "10px 18px", borderRadius: "6px", fontSize: "13px", fontWeight: "bold", cursor: "pointer", display: "inline-block", textAlign: "center" }}>
                    파일 선택
                    <input type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleImageSelect} />
                  </label>
                  <span style={{ fontSize: "14px", color: "#555" }}>
                    {tempFiles.length > 0 ? `총 ${tempFiles.length}개 파일 포함됨` : "선택한 파일 없음"}
                  </span>
                </div>
                <div style={{ fontSize: "12px", color: "#888" }}>최대 2 MB까지 업로드 가능 (최대 5장)</div>

                <div id="image-preview-container" style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "15px" }}>
                  {previewUrls.map((url, index) => (
                    <div key={index} style={{ position: "relative", display: "inline-block" }}>
                      <img src={url} style={{ width: "100px", height: "100px", objectFit: "cover", borderRadius: "8px", border: "1px solid #ddd" }} alt={`미리보기 ${index + 1}`} />
                      <button type="button" style={{ position: "absolute", top: "-5px", right: "-5px", background: "#f44336", color: "white", border: "none", borderRadius: "50%", width: "22px", height: "22px", cursor: "pointer", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px" }} onClick={() => removeFile(index)}>
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        ) : (
          <div id="preview-area" style={{ border: "2px solid #2196F3", padding: "30px", borderRadius: "8px", background: "#fafafa", boxShadow: "inset 0 0 15px rgba(0,0,0,0.03)" }}>
            <div style={{ borderBottom: "1px solid #ddd", paddingBottom: "15px", marginBottom: "20px" }}>
              <span style={{ color: "#2196F3", fontWeight: "bold", marginRight: "10px", fontSize: "16px" }}>[{category}]</span>
              <h3 style={{ margin: 0, display: "inline-block", fontSize: "22px", color: "#111" }}>{title || '제목이 없습니다'}</h3>
            </div>

            <div className="read-content" style={{ padding: 0, minHeight: "200px" }} dangerouslySetInnerHTML={{ __html: content }} />

            {previewUrls.length > 0 && (
              <div style={{ marginTop: "20px" }}>
                {previewUrls.map((url, index) => (
                  <img key={index} src={url} style={{ maxWidth: "100%", borderRadius: "8px", marginTop: "10px", border: "1px solid #ddd" }} alt={`첨부 미리보기 ${index + 1}`} />
                ))}
              </div>
            )}
          </div>
        )}

        <div className="write-buttons" style={{ display: "flex", justifyContent: "center", gap: "12px", marginTop: "30px", paddingBottom: "30px" }}>
          <button
            type="button"
            className="btn-cancel-new"
            style={{ backgroundColor: isPreviewMode ? "#999" : "#4CAF50", color: "white", padding: "14px 40px", fontSize: "16px", fontWeight: "bold", border: "none", borderRadius: "6px", cursor: "pointer" }}
            onClick={() => setIsPreviewMode(!isPreviewMode)}
          >
            {isPreviewMode ? "✏️ 수정하기" : "👀 미리보기"}
          </button>
          <button type="button" className="btn-submit-new" style={{ backgroundColor: "#ff6d00", color: "white", padding: "14px 40px", fontSize: "16px", fontWeight: "bold", border: "none", borderRadius: "6px", cursor: "pointer" }} onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? "등록 중..." : "작성 완료"}
          </button>
          <button type="button" className="btn-cancel-new" style={{ backgroundColor: "#333", color: "white", padding: "14px 40px", fontSize: "16px", fontWeight: "bold", border: "none", borderRadius: "6px", cursor: "pointer" }} onClick={handleCancel}>
            취소
          </button>
        </div>
      </div>
    </div>
  );
}