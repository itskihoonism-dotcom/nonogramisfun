"use client";

import { useState, useEffect, useMemo, use } from "react";
import { createClient } from "../../../../lib/supabaseClient"; // 🌟 우리가 만든 SSR용 클라이언트로 교체!
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";
import Script from "next/script"; 

const ReactQuill = dynamic(() => import("react-quill-new"), { 
  ssr: false, 
  loading: () => <div style={{ padding: "20px", color: "#999" }}>에디터를 불러오는 중입니다...</div> 
});

// 🚨 하드코딩되어 있던 SUPABASE_URL과 KEY 삭제 완료!

export default function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const supabase = createClient(); // 🌟 새로운 클라이언트 활성화!

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

  // 파일 첨부를 위한 상태 추가 (기존 이미지와 새 이미지를 분리해서 관리)
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [tempFiles, setTempFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);

  useEffect(() => {
    const fetchPostData = async () => {
      // 🌟 getSession() 대신 확실한 getUser()를 사용하여 쿠키에서 정보 확인!
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
      setContent(post.content);

      // DB에 저장되어 있던 기존 이미지 파싱해서 불러오기
      if (post.image && post.image !== "null" && post.image !== "[]") {
        try {
          const parsed = JSON.parse(post.image);
          setExistingImages(Array.isArray(parsed) ? parsed : [post.image]);
        } catch (e) {
          setExistingImages([post.image]);
        }
      }

      setIsLoading(false);
    };
    fetchPostData();
  }, [postId, router]);

  const modules = useMemo(() => ({
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ color: [] }, { background: [] }],
      [{ list: "ordered" }, { list: "bullet" }, { align: [] }],
      ["link"],
    ],
  }), []);

  // 파일 선택 함수
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    // 기존 이미지 + 새 이미지 합쳐서 최대 5장 검사
    const totalCurrentImages = existingImages.length + tempFiles.length;
    if (totalCurrentImages + files.length > 5) {
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

  // 기존에 올렸던 파일 지우기 (휴지통에 담기)
  const removeExistingImage = (index: number) => {
    const targetUrl = existingImages[index];
    setImagesToDelete(prev => [...prev, targetUrl]);
    setExistingImages(existingImages.filter((_, i) => i !== index));
  };

  // 방금 새로 올린 파일 지우기
  const removeNewFile = (index: number) => {
    const newFiles = tempFiles.filter((_, i) => i !== index);
    setTempFiles(newFiles);
    setPreviewUrls(newFiles.map(file => URL.createObjectURL(file)));
  };

  const handleUpdate = async () => {
    if (!title.trim() || !content.trim()) return alert("제목과 내용을 입력해주세요.");
    setIsSaving(true);

    // 1. 휴지통 비우기: 사용자가 지운 기존 사진들을 스토리지(버킷)에서 완전히 삭제!
    if (imagesToDelete.length > 0) {
      try {
        const filePaths = imagesToDelete.map(url => url.split('community_images/')[1]).filter(Boolean);
        if (filePaths.length > 0) {
          const { error: storageError } = await supabase.storage.from("community_images").remove(filePaths);
          if (storageError) console.error("스토리지 휴지통 비우기 에러:", storageError);
        }
      } catch (e) {
        console.error("이미지 경로 파싱 에러:", e);
      }
    }
    
    // 삭제되지 않고 살아남은 '기존 이미지' 목록
    let uploadedImageUrls = [...existingImages];

    // '새로 추가된 이미지'들을 스토리지에 업로드
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

    const { error } = await supabase.from("community_posts").update({
      category: category,
      title: title,
      content: content,
      image: imageStr, 
      is_notice: category === "공지사항"
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

  if (isLoading) return <div style={{ padding: "40px", textAlign: "center" }}>게시글 데이터를 불러오는 중...</div>;

  return (
    <div className="view active">
      {/* 📢 기기별 맞춤 카카오 애드핏 광고 시작 */}
      <div>
        <div className="ad-pc">
          <ins className="kakao_ad_area" style={{ display: "none" }}
            data-ad-unit="DAN-61T83j6HkgDDyPRJ" 
            data-ad-width="728" 
            data-ad-height="90"></ins>
        </div>

        <div className="ad-mobile">
          <ins className="kakao_ad_area" style={{ display: "none" }}
            data-ad-unit="DAN-q2LTq4MFcYdFmszx" 
            data-ad-width="320" 
            data-ad-height="100"></ins>
        </div>
        
        {/* 🌟 Next.js 방식의 카카오 애드핏 스크립트 실행 */}
        <Script type="text/javascript" src="//t1.kakaocdn.net/kas/static/ba.min.js" strategy="lazyOnload" />
      </div>
      {/* 📢 카카오 애드핏 광고 끝 */}
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
              
              <div style={{ position: "relative" }}>
                {isHtmlMode ? (
                  <textarea 
                    className="write-input"
                    style={{ width: "100%", height: "400px", fontFamily: "monospace", fontSize: "14px", background: "#222", color: "#0f0", boxSizing: "border-box" }}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                ) : (
                  <div style={{ background: "#fff", borderRadius: "0 0 6px 6px" }}>
                    <ReactQuill theme="snow" modules={modules} value={content} onChange={setContent} style={{ height: "350px", marginBottom: "40px" }} />
                  </div>
                )}
              </div>
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
                    {existingImages.length + tempFiles.length > 0 ? `총 ${existingImages.length + tempFiles.length}개 파일 포함됨` : "선택한 파일 없음"}
                  </span>
                </div>
                <div style={{ fontSize: "12px", color: "#888" }}>최대 2 MB까지 업로드 가능 (최대 5장)</div>
                
                <div id="image-preview-container" style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "15px" }}>
                  {existingImages.map((url, index) => (
                    <div key={`existing-${index}`} style={{ position: "relative", display: "inline-block" }}>
                      <img src={url} style={{ width: "100px", height: "100px", objectFit: "cover", borderRadius: "8px", border: "1px solid #ddd" }} alt={`기존 첨부 ${index + 1}`} />
                      <button type="button" style={{ position: "absolute", top: "-5px", right: "-5px", background: "#333", color: "white", border: "none", borderRadius: "50%", width: "22px", height: "22px", cursor: "pointer", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px" }} onClick={() => removeExistingImage(index)}>
                        ✕
                      </button>
                    </div>
                  ))}
                  {previewUrls.map((url, index) => (
                    <div key={`new-${index}`} style={{ position: "relative", display: "inline-block" }}>
                      <img src={url} style={{ width: "100px", height: "100px", objectFit: "cover", borderRadius: "8px", border: "1px solid #ddd" }} alt={`새 첨부 ${index + 1}`} />
                      <button type="button" style={{ position: "absolute", top: "-5px", right: "-5px", background: "#f44336", color: "white", border: "none", borderRadius: "50%", width: "22px", height: "22px", cursor: "pointer", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px" }} onClick={() => removeNewFile(index)}>
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
            
            <div className="read-content ql-editor" style={{ padding: 0, minHeight: "200px" }} dangerouslySetInnerHTML={{ __html: content }} />
            
            {(existingImages.length > 0 || previewUrls.length > 0) && (
              <div style={{ marginTop: "20px" }}>
                {existingImages.map((url, index) => (
                  <img key={`prev-exist-${index}`} src={url} style={{ maxWidth: "100%", borderRadius: "8px", marginTop: "10px", border: "1px solid #ddd" }} alt={`기존 첨부 미리보기 ${index + 1}`} />
                ))}
                {previewUrls.map((url, index) => (
                  <img key={`prev-new-${index}`} src={url} style={{ maxWidth: "100%", borderRadius: "8px", marginTop: "10px", border: "1px solid #ddd" }} alt={`새 첨부 미리보기 ${index + 1}`} />
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
            onClick={() => router.push(`/community/${postId}`)}
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}