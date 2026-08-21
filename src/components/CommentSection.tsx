"use client";

import { useState, useEffect } from "react";
import { createClient } from "../lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function CommentSection({ postId, initialComments, commentCount }: { postId: number, initialComments: any[], commentCount: number }) {
  const router = useRouter();
  const supabase = createClient();
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const [mainContent, setMainContent] = useState("");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: userData } = await supabase.from("user_ids").select("nickname, custom_id").eq("email", session.user.email).maybeSingle();
        const nickname = userData?.nickname || session.user.user_metadata?.nickname || "익명";
        setCurrentUser({ nickname, isAdmin: nickname === "주인장" || userData?.custom_id === "admin" });
      }
    };
    checkAuth();
  }, []);

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  // 🌟 [핵심 해결책] DB에 남은 진짜 댓글 갯수를 다시 세어서 업데이트하는 만능 함수!
  const syncCommentCount = async () => {
    const { count } = await supabase
      .from("community_comments")
      .select("*", { count: "exact", head: true })
      .eq("post_id", postId);

    await supabase
      .from("community_posts")
      .update({ comments: count || 0 })
      .eq("id", postId);
  };

  const handleSubmit = async (parentId: number | null = null) => {
    if (!currentUser) return alert("로그인 후 이용해주세요.");
    const targetContent = parentId ? replyContent : mainContent;
    if (!targetContent.trim()) return alert("내용을 입력해주세요.");

    const { error } = await supabase.from("community_comments").insert([{ 
      post_id: postId, 
      author: currentUser.nickname, 
      content: targetContent,
      parent_id: parentId 
    }]);

    if (!error) {
      await syncCommentCount(); // 🌟 무식한 +1 대신 진짜 갯수로 동기화!
      if (parentId) {
        setReplyContent("");
        setReplyingTo(null);
      } else {
        setMainContent("");
      }
      router.refresh(); 
    } else {
      alert("댓글 등록 실패: " + error.message);
    }
  };


  // 🌟 댓글 수정 모드 켜기
  const handleEditClick = (commentId: number, currentContent: string) => {
    setEditingCommentId(commentId);
    setEditContent(currentContent);
    setReplyingTo(null); // 수정 중일 땐 답글 창 닫기
  };

  // 🌟 댓글 수정 완료
  const handleUpdate = async (commentId: number) => {
    if (!editContent.trim()) return;
    const { error } = await supabase.from("community_comments").update({ content: editContent }).eq("id", commentId);
    if (!error) {
      setEditingCommentId(null);
      router.refresh();
    } else {
      alert("수정 실패: " + error.message);
    }
  };

 // 🌟 확실하게 부모와 자식 댓글을 동반 삭제하도록 수정한 함수
  const handleDelete = async (commentId: number) => {
    if (!confirm("정말로 이 댓글을 삭제하시겠습니까? (달려있는 답글도 함께 삭제됩니다.)")) return;
    
    // 1. 이 댓글을 부모로 두고 있는 모든 대댓글(답글)들을 먼저 싹 지웁니다.
    await supabase.from("community_comments").delete().eq("parent_id", commentId);
    
    // 2. 선택한 본인 댓글을 지웁니다.
    const { error } = await supabase.from("community_comments").delete().eq("id", commentId);
    
    if (!error) {
      // 3. 남은 진짜 갯수를 다시 세어서 게시글 테이블에 반영합니다.
      await syncCommentCount();
      router.refresh();
    } else {
      alert("삭제 실패: " + error.message);
    }
  };

  const parentComments = initialComments.filter(c => !c.parent_id);
  const getReplies = (parentId: number) => initialComments.filter(c => c.parent_id === parentId);

  return (
    <div className="comments-section" style={{ marginTop: "40px", borderTop: "2px solid #111", paddingTop: "20px" }}>
      {/* 🌟 화면에 보여줄 때도 에러 난 가짜 숫자 대신, 방금 서버에서 받아온 100% 진짜 길이(length)를 보여줍니다! */}
      <div className="comments-header" style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "20px" }}>
        댓글 {initialComments.length}개
      </div>
      
      <ul style={{ listStyle: "none", padding: 0, margin: "0 0 30px 0" }}>
        {parentComments.map((comment) => (
          <li key={comment.id} style={{ marginBottom: "20px", borderBottom: "1px solid #eee", paddingBottom: "15px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "14px", fontWeight: "bold" }}>{comment.author === "주인장" ? "⚙️" : "👤"} {comment.author}</span>
                <span style={{ fontSize: "12px", color: "#888" }}>{formatDate(comment.created_at)}</span>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)} style={{ background: "none", border: "none", color: "#888", fontSize: "12px", cursor: "pointer", padding: 0 }}>
                  {replyingTo === comment.id ? "취소" : "답글달기"}
                </button>
{currentUser && (currentUser.nickname === comment.author || currentUser.isAdmin) && (
                  <>
                    <button onClick={() => handleEditClick(comment.id, comment.content)} style={{ background: "none", border: "none", color: "#2196F3", fontSize: "12px", cursor: "pointer", padding: 0 }}>수정</button>
                    <button onClick={() => handleDelete(comment.id)} style={{ background: "none", border: "none", color: "#f44336", fontSize: "12px", cursor: "pointer", padding: 0 }}>삭제</button>
                  </>
                )}
              </div>
            </div>
            {editingCommentId === comment.id ? (
              <div style={{ marginTop: "10px" }}>
                <textarea 
                  value={editContent} 
                  onChange={(e) => setEditContent(e.target.value)} 
                  style={{ width: "100%", height: "60px", padding: "10px", fontSize: "14px", border: "1px solid #ddd", borderRadius: "4px", resize: "none", marginBottom: "8px" }}
                />
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "5px" }}>
                  <button onClick={() => handleUpdate(comment.id)} style={{ padding: "4px 12px", backgroundColor: "#4CAF50", color: "#fff", border: "none", borderRadius: "3px", fontSize: "12px", cursor: "pointer" }}>저장</button>
                  <button onClick={() => setEditingCommentId(null)} style={{ padding: "4px 12px", backgroundColor: "#999", color: "#fff", border: "none", borderRadius: "3px", fontSize: "12px", cursor: "pointer" }}>취소</button>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: "14px", lineHeight: 1.6, color: "#222", wordBreak: "break-word" }}>{comment.content}</div>
            )}

            {getReplies(comment.id).map(reply => (
              <div key={reply.id} style={{ background: "#f8f9fa", padding: "12px 15px", borderRadius: "6px", marginTop: "10px", marginLeft: "20px", position: "relative" }}>
                <div style={{ position: "absolute", left: "-15px", top: "15px", color: "#ccc", borderLeft: "2px solid #ddd", borderBottom: "2px solid #ddd", width: "10px", height: "10px" }}></div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "13px", fontWeight: "bold" }}>{reply.author === "주인장" ? "⚙️" : "👤"} {reply.author}</span>
                    <span style={{ fontSize: "11px", color: "#888" }}>{formatDate(reply.created_at)}</span>
                  </div>
                  {currentUser && (currentUser.nickname === reply.author || currentUser.isAdmin) && (
                    <div style={{ display: "flex", gap: "10px" }}>
                      <button onClick={() => handleEditClick(reply.id, reply.content)} style={{ background: "none", border: "none", color: "#2196F3", fontSize: "12px", cursor: "pointer", padding: 0 }}>수정</button>
                      <button onClick={() => handleDelete(reply.id)} style={{ background: "none", border: "none", color: "#f44336", fontSize: "12px", cursor: "pointer", padding: 0 }}>삭제</button>
                    </div>
                  )}
                </div>
                {editingCommentId === reply.id ? (
                  <div style={{ marginTop: "8px" }}>
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      style={{ width: "100%", height: "50px", padding: "8px", fontSize: "13px", border: "1px solid #ddd", borderRadius: "4px", resize: "none", marginBottom: "8px" }}
                    />
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "5px" }}>
                      <button onClick={() => handleUpdate(reply.id)} style={{ padding: "4px 12px", backgroundColor: "#4CAF50", color: "#fff", border: "none", borderRadius: "3px", fontSize: "12px", cursor: "pointer" }}>저장</button>
                      <button onClick={() => setEditingCommentId(null)} style={{ padding: "4px 12px", backgroundColor: "#999", color: "#fff", border: "none", borderRadius: "3px", fontSize: "12px", cursor: "pointer" }}>취소</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: "13px", lineHeight: 1.5, color: "#444" }}>{reply.content}</div>
                )}
              </div>
            ))}

            {replyingTo === comment.id && (
              <div style={{ display: "flex", gap: "10px", marginTop: "15px", marginLeft: "20px" }}>
                <textarea 
                  style={{ flex: 1, padding: "10px", borderRadius: "6px", border: "1px solid #ddd", resize: "none", height: "60px", fontSize: "13px" }}
                  placeholder="답글을 남겨보세요."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                />
                <button type="button" onClick={() => handleSubmit(comment.id)} style={{ padding: "0 20px", background: "#333", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: "bold" }}>
                  등록
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>

      <div className="comment-write-box">
        <div className="comment-input-area" style={{ display: "flex", gap: "10px" }}>
          <textarea 
            placeholder="로그인 후 댓글을 남겨보세요." 
            value={mainContent} 
            onChange={(e) => setMainContent(e.target.value)}
            style={{ flex: 1, padding: "15px", borderRadius: "6px", border: "1px solid #ddd", resize: "vertical", minHeight: "80px", fontSize: "14px" }}
          />
          <button type="button" onClick={() => handleSubmit(null)} style={{ padding: "0 25px", background: "#ff6d00", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "15px", fontWeight: "bold" }}>
            등록
          </button>
        </div>
      </div>
    </div>
  );
}