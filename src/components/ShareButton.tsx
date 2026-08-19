"use client";

import { useState } from "react";

export default function ShareButton({ title, url }: { title: string; url?: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const getShareUrl = () => url || (typeof window !== "undefined" ? window.location.href : "");

  const handleKakao = () => {
    const Kakao = (window as any).Kakao;
    if (!Kakao) return alert("카카오 공유 준비 중입니다. 잠시 후 다시 시도해주세요.");
    if (!Kakao.isInitialized()) Kakao.init(process.env.NEXT_PUBLIC_KAKAO_JS_KEY);
    Kakao.Share.sendDefault({
      objectType: "feed",
      content: {
        title,
        description: "NONOGRAM IS FUN",
        imageUrl: "https://nonogramisfun.com/logo.webp",
        link: { mobileWebUrl: getShareUrl(), webUrl: getShareUrl() },
      },
      buttons: [{ title: "바로가기", link: { mobileWebUrl: getShareUrl(), webUrl: getShareUrl() } }],
    });
  };

  const handleFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getShareUrl())}`, "_blank", "width=600,height=400");
  };

  const handleX = () => {
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(getShareUrl())}&text=${encodeURIComponent(title)}`, "_blank", "width=600,height=400");
  };

  const handleNaver = () => {
    window.open(`https://share.naver.com/web/shareView?url=${encodeURIComponent(getShareUrl())}&title=${encodeURIComponent(title)}`, "_blank", "width=600,height=400");
  };

  const handleCopy = async () => {
    const text = getShareUrl();
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      alert("복사에 실패했습니다. 주소를 직접 선택해서 복사해주세요.");
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{ display: "flex", alignItems: "center", gap: "4px", padding: "6px 14px", borderRadius: "20px", fontSize: "13px", fontWeight: "bold", cursor: "pointer", backgroundColor: "#fff", border: "1px solid #ddd", color: "#666" }}
      >
        🔗 공유하기
      </button>

      {open && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
          style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", justifyContent: "center", alignItems: "center", padding: "20px", boxSizing: "border-box" }}
        >
          <div style={{ background: "#2b2b2b", color: "#fff", padding: "25px", borderRadius: "12px", width: "380px", maxWidth: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" }}>
              <h3 style={{ margin: 0, fontSize: "18px" }}>공유하기</h3>
              <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", color: "#aaa", fontSize: "20px", cursor: "pointer" }}>×</button>
            </div>

            <div style={{ display: "flex", justifyContent: "space-around", marginBottom: "25px" }}>
              <button onClick={handleKakao} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", color: "#ddd", fontSize: "12px" }}>
                <span style={{ width: "56px", height: "56px", borderRadius: "50%", background: "#FEE500", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "26px" }}>💬</span>
                카카오톡
              </button>
              <button onClick={handleFacebook} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", color: "#ddd", fontSize: "12px" }}>
                <span style={{ width: "56px", height: "56px", borderRadius: "50%", background: "#3B5998", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", color: "#fff", fontWeight: "bold" }}>f</span>
                페이스북
              </button>
              <button onClick={handleX} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", color: "#ddd", fontSize: "12px" }}>
                <span style={{ width: "56px", height: "56px", borderRadius: "50%", background: "#000", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", color: "#fff", fontWeight: "bold" }}>X</span>
                X
              </button>
              <button onClick={handleNaver} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", color: "#ddd", fontSize: "12px" }}>
                <span style={{ width: "56px", height: "56px", borderRadius: "50%", background: "#03C75A", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", color: "#fff", fontWeight: "bold" }}>N</span>
                네이버
              </button>
            </div>

            <div style={{ display: "flex", border: "1px solid #555", borderRadius: "6px", overflow: "hidden" }}>
              <input readOnly value={getShareUrl()} style={{ flex: 1, padding: "10px 12px", background: "#1f1f1f", color: "#ccc", border: "none", fontSize: "13px", minWidth: 0 }} />
              <button onClick={handleCopy} style={{ padding: "10px 16px", background: "#444", color: "#fff", border: "none", fontSize: "13px", fontWeight: "bold", cursor: "pointer", whiteSpace: "nowrap" }}>
                {copied ? "복사됨!" : "URL 복사"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}