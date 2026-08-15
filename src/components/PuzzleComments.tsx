"use client";

import { useEffect, useState } from "react";
import { createClient } from "../lib/supabaseClient"; 
import { useRouter } from "next/navigation";

// 🌟 props가 puzzleId(문자열)에서 puzzle(객체 통째로)로 변경되었습니다!
export default function PuzzleComments({ puzzle, isGameCleared }: { puzzle: any, isGameCleared: boolean }) {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isClearedDb, setIsClearedDb] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // 🌟 추천/비추천 상태 관리
  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [hasDisliked, setHasDisliked] = useState(false);
  
  const supabase = createClient();
  const router = useRouter();

  // 🌟 댓글 수정 상태 관리
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  useEffect(() => {
    checkEligibilityAndFetch();
  }, [puzzle.id]);

  const checkEligibilityAndFetch = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    let currentUser = null;
    
    if (session) {
      currentUser = session.user;
      setUser(currentUser);
      
      // 관리자 여부 확인
      const { data: userData } = await supabase.from('user_ids').select('nickname, custom_id').eq('email', currentUser.email).maybeSingle();
      const nickname = userData?.nickname || currentUser.user_metadata?.nickname;
      const customId = userData?.custom_id || currentUser.user_metadata?.custom_id;
      if (nickname === '주인장' || customId === 'admin') setIsAdmin(true);

      // 클리어 여부 확인
      const { data: clearData } = await supabase.from('completed_puzzles').select('id').eq('puzzle_id', puzzle.id).eq('user_id', currentUser.id).maybeSingle();
      if (clearData) setIsClearedDb(true);
    }

    // 🌟 추천/비추천 총개수 가져오기
    const { count: lCount } = await supabase.from('puzzle_likes').select('*', { count: 'exact', head: true }).eq('puzzle_id', puzzle.id);
    const { count: dCount } = await supabase.from('puzzle_dislikes').select('*', { count: 'exact', head: true }).eq('puzzle_id', puzzle.id);
    setLikes(lCount || 0);
    setDislikes(dCount || 0);

    // 🌟 현재 유저의 추천/비추천 여부 확인
    if (currentUser) {
      const { data: lData } = await supabase.from('puzzle_likes').select('id').match({ puzzle_id: puzzle.id, user_id: currentUser.id }).maybeSingle();
      if (lData) setHasLiked(true);

      const { data: dData } = await supabase.from('puzzle_dislikes').select('id').match({ puzzle_id: puzzle.id, user_id: currentUser.id }).maybeSingle();
      if (dData) setHasDisliked(true);
    }

    fetchComments();
  };

  const fetchComments = async () => {
    const { data } = await supabase.from('puzzle_comments').select('*').eq('puzzle_id', puzzle.id).order('created_at', { ascending: false });
    if (data) setComments(data);
  };

  // 🌟 추천 버튼 클릭 함수
  const handleLike = async () => {
    if (!user) return alert("로그인 후 이용할 수 있습니다.");
    if (hasLiked) {
      await supabase.from('puzzle_likes').delete().match({ puzzle_id: puzzle.id, user_id: user.id });
      setLikes(l => l - 1);
      setHasLiked(false);
    } else {
      if (hasDisliked) {
        await supabase.from('puzzle_dislikes').delete().match({ puzzle_id: puzzle.id, user_id: user.id });
        setDislikes(d => d - 1);
        setHasDisliked(false);
      }
      await supabase.from('puzzle_likes').insert({ puzzle_id: puzzle.id, user_id: user.id });
      setLikes(l => l + 1);
      setHasLiked(true);
    }
  };

  // 🌟 비추천 버튼 클릭 함수
  const handleDislike = async () => {
    if (!user) return alert("로그인 후 이용할 수 있습니다.");
    if (hasDisliked) {
      await supabase.from('puzzle_dislikes').delete().match({ puzzle_id: puzzle.id, user_id: user.id });
      setDislikes(d => d - 1);
      setHasDisliked(false);
    } else {
      if (hasLiked) {
        await supabase.from('puzzle_likes').delete().match({ puzzle_id: puzzle.id, user_id: user.id });
        setLikes(l => l - 1);
        setHasLiked(false);
      }
      await supabase.from('puzzle_dislikes').insert({ puzzle_id: puzzle.id, user_id: user.id });
      setDislikes(d => d + 1);
      setHasDisliked(true);
    }
  };

  // 🌟 퍼즐 삭제 함수
  const handleDeletePuzzle = async () => {
    if (!confirm("정말 이 퍼즐을 삭제하시겠습니까?\n삭제된 퍼즐은 복구할 수 없습니다.")) return;
    const { error } = await supabase.from('puzzles').delete().eq('id', puzzle.id);
    if (!error) {
      alert("퍼즐이 안전하게 삭제되었습니다.");
      router.push("/all-puzzles");
    } else {
      alert("삭제 실패: " + error.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user || (!isClearedDb && !isGameCleared)) return;
    const authorName = user.user_metadata?.nickname || user.email.split('@')[0];
    const { error } = await supabase.from('puzzle_comments').insert({ puzzle_id: puzzle.id, user_id: user.id, author: authorName, content: newComment });
    if (!error) { setNewComment(""); fetchComments(); }
  };

  // 🌟 댓글 수정 모드 켜기
  const handleEditClick = (comment: any) => {
    setEditingCommentId(comment.id);
    setEditContent(comment.content);
  };

  // 🌟 댓글 수정 완료
  const handleUpdateComment = async (commentId: string) => {
    if (!editContent.trim()) return;
    const { error } = await supabase.from('puzzle_comments').update({ content: editContent }).eq('id', commentId);
    if (!error) {
      setEditingCommentId(null);
      fetchComments();
    }
  };

  // 🌟 댓글 삭제
  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("댓글을 삭제하시겠습니까?")) return;
    const { error } = await supabase.from('puzzle_comments').delete().eq('id', commentId);
    if (!error) fetchComments();
  };

  const hasClearPermission = isClearedDb || isGameCleared;
  const authorName = user?.user_metadata?.nickname || user?.email?.split('@')[0] || "";
  const canDelete = isAdmin || (puzzle.author === authorName);

  return (
    <div className="puzzle-comments-box" style={{ marginTop: "40px" }}>
      
      {/* 🌟 추천 / 비추천 / 삭제 버튼 행 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div style={{ display: "flex", gap: "10px" }}>
          <button 
            onClick={handleLike} 
            style={{ display: "flex", alignItems: "center", gap: "4px", padding: "6px 18px", borderRadius: "20px", fontSize: "14px", fontWeight: "bold", cursor: "pointer", backgroundColor: "#fff", border: hasLiked ? "1.5px solid #FF9800" : "1px solid #ddd", color: hasLiked ? "#FF9800" : "#666", transition: "all 0.2s" }}
          >
            👍 추천 {likes}
          </button>
          <button 
            onClick={handleDislike} 
            style={{ display: "flex", alignItems: "center", gap: "4px", padding: "6px 18px", borderRadius: "20px", fontSize: "14px", fontWeight: "bold", cursor: "pointer", backgroundColor: "#fff", border: hasDisliked ? "1.5px solid #999" : "1px solid #ddd", color: hasDisliked ? "#333" : "#666", transition: "all 0.2s" }}
          >
            👎 비추천 {dislikes}
          </button>
        </div>

        {/* 작성자 본인이거나 관리자(주인장)일 경우에만 노출 */}
        {canDelete && (
          <button 
            onClick={handleDeletePuzzle} 
            style={{ backgroundColor: "#f44336", color: "#fff", border: "none", padding: "6px 16px", borderRadius: "4px", fontSize: "13px", fontWeight: "bold", cursor: "pointer" }}
          >
            삭제
          </button>
        )}
      </div>

      {/* 🌟 커뮤니티 테마 댓글 영역 */}
      <div style={{ borderTop: "2px solid #222", paddingTop: "20px" }}>
        <h3 style={{ fontSize: "16px", fontWeight: "bold", marginBottom: "15px" }}>
          댓글 {comments.length}개
        </h3>

        {/* 커뮤니티식 입력 폼 */}
        <div style={{ border: "1px solid #ddd", borderRadius: "6px", padding: "15px", backgroundColor: "#fff", marginBottom: "30px" }}>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            disabled={!user || !hasClearPermission}
            placeholder={!user ? "로그인 후 댓글을 남겨보세요." : !hasClearPermission ? "🔒 퍼즐을 끝까지 완성한 사용자만 댓글을 남길 수 있습니다!" : "퍼즐에 대한 후기를 남겨주세요! (스포일러 주의)"}
            style={{ width: "100%", height: "60px", border: "none", outline: "none", resize: "none", fontSize: "14px", backgroundColor: "transparent", color: (!user || !hasClearPermission) ? "#999" : "#333" }}
          />
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "10px" }}>
            <button
              onClick={handleSubmit}
              disabled={!user || !hasClearPermission}
              style={{ backgroundColor: (!user || !hasClearPermission) ? "#ccc" : "#FF5722", color: "#fff", border: "none", padding: "8px 24px", borderRadius: "4px", fontSize: "14px", fontWeight: "bold", cursor: (!user || !hasClearPermission) ? "not-allowed" : "pointer" }}
            >
              등록
            </button>
          </div>
        </div>

        {/* 댓글 목록 */}
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {comments.map((c) => {
            const isCommentAuthor = user && (c.user_id === user.id);
            const canManageComment = isAdmin || isCommentAuthor;

            return (
              <li key={c.id} style={{ padding: "15px 0", borderBottom: "1px solid #f0f0f0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <strong style={{ fontSize: "14px", color: "#333" }}>{c.author === "주인장" ? "⚙️" : "👤"} {c.author}</strong>
                    <span style={{ fontSize: "12px", color: "#999" }}>{new Date(c.created_at).toLocaleString()}</span>
                  </div>
                  
                  {/* 🌟 수정/삭제 버튼 (본인 또는 관리자만 보임) */}
                  {canManageComment && editingCommentId !== c.id && (
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button onClick={() => handleEditClick(c)} style={{ background: "none", border: "none", fontSize: "12px", color: "#2196F3", cursor: "pointer", padding: 0 }}>수정</button>
                      <button onClick={() => handleDeleteComment(c.id)} style={{ background: "none", border: "none", fontSize: "12px", color: "#f44336", cursor: "pointer", padding: 0 }}>삭제</button>
                    </div>
                  )}
                </div>

                {/* 🌟 수정 모드일 때와 아닐 때 분기 처리 */}
                {editingCommentId === c.id ? (
                  <div style={{ marginTop: "10px" }}>
                    <textarea 
                      value={editContent} 
                      onChange={(e) => setEditContent(e.target.value)} 
                      style={{ width: "100%", height: "50px", padding: "8px", fontSize: "14px", border: "1px solid #ddd", borderRadius: "4px", resize: "none", marginBottom: "8px" }}
                    />
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "5px" }}>
                      <button onClick={() => handleUpdateComment(c.id)} style={{ padding: "4px 12px", backgroundColor: "#4CAF50", color: "#fff", border: "none", borderRadius: "3px", fontSize: "12px", cursor: "pointer" }}>저장</button>
                      <button onClick={() => setEditingCommentId(null)} style={{ padding: "4px 12px", backgroundColor: "#999", color: "#fff", border: "none", borderRadius: "3px", fontSize: "12px", cursor: "pointer" }}>취소</button>
                    </div>
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: "14px", color: "#444", wordBreak: "break-word", lineHeight: "1.5" }}>
                    {c.content}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </div>
      
    </div>
  );
}