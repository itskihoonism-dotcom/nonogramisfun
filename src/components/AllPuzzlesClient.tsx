"use client";

import { useState, useEffect } from "react";
import { createClient } from "../lib/supabaseClient";
import Link from "next/link";
import KakaoAd from "../components/KakaoAd";
import AuthorBadge from "./AuthorBadge";

// N시간 전/분 전 포맷 적용
const formatDate = (dateString: string) => {
  if (!dateString) return "";
  const isoString = /Z$|[+-]\d{2}:?\d{2}$/.test(dateString) ? dateString : dateString + "Z";
  const d = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 24 && now.getDate() === d.getDate()) {
    if (diffMins < 60) return diffMins <= 0 ? "방금 전" : `${diffMins}분 전`;
    return `${diffHours}시간 전`;
  }
  
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
};

function isNew(dateStr: string) {
  if (!dateStr) return false;
  return (new Date().getTime() - new Date(dateStr).getTime()) / 3600000 <= 24;
}

export default function AllPuzzlesClient({ initialPuzzles, isAdmin }: { initialPuzzles: any[], isAdmin: boolean }) {
  const supabase = createClient();
  const [puzzles, setPuzzles] = useState(initialPuzzles);
  const [completedPuzzleIds, setCompletedPuzzleIds] = useState<number[]>([]);
  
  // 카테고리(크기) 필터 상태
  const [selectedSize, setSelectedSize] = useState("all");

  // 🌟 관리자 미리보기 팝업 상태 추가
  const [previewPuzzle, setPreviewPuzzle] = useState<any>(null);

    const [authorInfo, setAuthorInfo] = useState<Record<string, { points: number; isAdmin: boolean }>>({});

  // 고유한 크기만 뽑아내서 오름차순 정렬
  const availableSizes = Array.from(
    new Set(puzzles.map(p => `${p.width}x${p.height}`))
  ).sort((a, b) => parseInt(a.split('x')[0]) - parseInt(b.split('x')[0]));

  const filteredPuzzles = puzzles.filter(p => 
    selectedSize === "all" || `${p.width}x${p.height}` === selectedSize
  );

  // 🌟 여기서부터 아래 코드를 추가하세요 🌟
  const [currentPage, setCurrentPage] = useState(1);
  const POSTS_PER_PAGE = 15;

  // 카테고리를 변경하면 항상 1페이지로 돌아가도록 설정
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedSize]);

  // 현재 페이지에 보여줄 10개의 퍼즐만 쏙 잘라내기
  const totalPages = Math.ceil(filteredPuzzles.length / POSTS_PER_PAGE);
  const paginatedPuzzles = filteredPuzzles.slice(
    (currentPage - 1) * POSTS_PER_PAGE,
    currentPage * POSTS_PER_PAGE
  );
  // 🌟 여기까지 🌟

  useEffect(() => {
    const fetchCompletedPuzzles = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase
          .from('completed_puzzles')
          .select('puzzle_id')
          .eq('user_id', session.user.id);

        if (data) {
          setCompletedPuzzleIds(data.map(row => row.puzzle_id));
        }
      }
    };
    fetchCompletedPuzzles();
  }, [supabase]);


    useEffect(() => {
    const fetchAuthorBadges = async () => {
      const authors = Array.from(new Set(puzzles.map(p => p.author).filter(Boolean)));
      if (authors.length === 0) return;

      const { data } = await supabase.from("user_ids").select("nickname, points, custom_id").in("nickname", authors);
      if (!data) return;

      const map: Record<string, { points: number; isAdmin: boolean }> = {};
      data.forEach((u: any) => {
        map[u.nickname] = { points: u.points || 0, isAdmin: u.nickname === "주인장" || u.custom_id === "admin" };
      });
      setAuthorInfo(map);
    };
    fetchAuthorBadges();
  }, [puzzles]);

  // 🌟 관리자 전용: 퍼즐 승인 처리
  const handleApprove = async (id: number, title: string) => {
    if (!confirm(`'${title}' 퍼즐을 승인하시겠습니까?`)) return;
    const { error } = await supabase.from("puzzles").update({ is_approved: true }).eq("id", id);
    if (error) return alert("승인 실패: " + error.message);
    alert("승인되었습니다.");
    setPuzzles(prev => prev.map(p => (p.id === id ? { ...p, is_approved: true } : p)));
    setPreviewPuzzle((prev: any) => (prev ? { ...prev, is_approved: true } : prev));
  };

    // 🌟 관리자 전용: 퍼즐 삭제 처리
  const handleDeletePuzzle = async (id: number, title: string) => {
    if (!confirm(`'${title}' 퍼즐을 삭제하시겠습니까?\n삭제된 퍼즐은 복구할 수 없습니다.`)) return;
    const { error } = await supabase.from("puzzles").delete().eq("id", id);
    if (error) return alert("삭제 실패: " + error.message);
    alert("퍼즐이 삭제되었습니다.");
    setPuzzles(prev => prev.filter(p => p.id !== id));
    setPreviewPuzzle(null);
  };
  
  // 🌟 팝업창 안에서 렌더링될 미리보기 캔버스 (크기 조절 가능하도록 수정)
  const PreviewCanvas = ({ width, height, data, maxSize = 300 }: { width: number, height: number, data: number[], maxSize?: number }) => {
    if (!data || data.length === 0) return null;
    const cellSize = Math.max(2, Math.floor(maxSize / Math.max(width, height)));
    const gridWidth = width * cellSize;
    const gridHeight = height * cellSize;

    return (
      <div style={{ background: "#fff", border: "2px solid #333", padding: "5px", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${width}, ${cellSize}px)`, gridTemplateRows: `repeat(${height}, ${cellSize}px)`, width: `${gridWidth}px`, height: `${gridHeight}px` }}>
          {data.map((val, idx) => (
            <div key={idx} style={{ backgroundColor: val === 1 ? "#333" : "transparent" }} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="view active">

      {/* 📢 상단 카카오 애드핏 광고 */}
      <div style={{ marginTop: "15px", marginBottom: "15px" }}>
        <div className="ad-pc">
          <KakaoAd unit="DAN-JpEOwXzUOs9jTxSy" width="728" height="90" />
        </div>
        <div className="ad-mobile">
          <KakaoAd unit="DAN-sA8hy7KHOiESBxQC" width="320" height="100" />
        </div>
      </div>

      <div className="header-title-bar" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderBottom: "2px solid #222", paddingBottom: "12px", marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
          <h2 style={{ margin: 0, padding: 0 }}>🧩 창작 퍼즐 목록</h2>
          
          <select 
            value={selectedSize} 
            onChange={(e) => setSelectedSize(e.target.value)}
            style={{ padding: "4px 8px", fontSize: "13px", border: "1px solid #ccc", borderRadius: "4px", outline: "none", cursor: "pointer" }}
          >
            <option value="all">크기 전체</option>
            {availableSizes.map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>
        
        <Link href="/make-puzzle" className="btn-write" style={{ display: "inline-block", textDecoration: "none", padding: "6px 12px", fontSize: "13px" }}>
          + 직접 퍼즐 만들기
        </Link>
      </div>

      {/* 게시판 헤더 (관리 열 삭제됨) */}
      <div className="board-header">
        <div className="col-badge">번호</div>
        <div className="col-cate">크기</div>
        <div className="col-title" style={{ textAlign: "center" }}>제목</div>
        <div className="col-author">작성자</div>
        <div className="col-date">날짜</div>
        <div className="col-views">조회</div>
        <div className="col-likes">추천</div>
      </div>

      {/* 게시판 리스트 */}
<ul className="post-list">
        {paginatedPuzzles.length === 0 ? ( // 👈 여기도 변경
          <li style={{ justifyContent: "center", color: "#999", padding: "40px 0" }}>등록된 퍼즐이 없습니다.</li>
        ) : (
          paginatedPuzzles.map((p, index) => { // 🌟 10개씩 잘라놓은 배열로 그리기!
            const isCleared = completedPuzzleIds.includes(p.id);
            const commentCount = p.comments?.[0]?.count || 0;
            const likeCount = p.likes?.[0]?.count || 0;
            
            // 🌟 페이지가 넘어가도 정확한 역순 번호를 계산하도록 수정!
            const listNumber = filteredPuzzles.length - ((currentPage - 1) * POSTS_PER_PAGE) - index;

            return (
              <li key={p.id} style={{ display: "flex", alignItems: "center" }}>
                <Link href={`/puzzle/${encodeURIComponent(p.slug)}`} className="post-row-link" style={{ flex: 1 }}>
                  
                  {/* 🌟 수정된 번호 열 */}
                  <div className="col-badge" style={{ color: "#888", fontSize: "13px", fontWeight: "bold" }}>
                    {listNumber}
                  </div>
                  
                  <div className="col-cate" style={{ color: "#E91E63", fontWeight: "bold" }}>
                    {p.width}x{p.height}
                  </div>
                  
                  {/* 제목, 댓글 수, 뱃지, 미리보기 버튼 */}
                  <div className="col-title" style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", overflow: "hidden" }}>
                    <div style={{ display: "flex", alignItems: "center", overflow: "hidden", width: "100%" }}>
                      {!p.is_approved && <span style={{ background: "#f44336", color: "white", fontSize: "11px", padding: "1px 5px", borderRadius: "3px", marginRight: "5px", flexShrink: 0 }}>미승인</span>}
                      {isNew(p.created_at) && <span style={{ backgroundColor: "#ff5722", color: "white", fontSize: "11px", fontWeight: "bold", padding: "1px 5px", borderRadius: "3px", marginRight: "5px", flexShrink: 0 }}>N</span>}
                      {isCleared && <span style={{ backgroundColor: "#E8F5E9", color: "#4CAF50", fontSize: "11px", fontWeight: "bold", border: "1px solid #4CAF50", padding: "0 4px", borderRadius: "3px", marginRight: "5px", flexShrink: 0 }}>✅ 완료</span>}

                      <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {p.title}
                      </span>

                      {/* 댓글 수 표시 [N] */}
                      {commentCount > 0 && (
                        <span style={{ color: "#e53935", fontWeight: "bold", fontSize: "14px", marginLeft: "6px", flexShrink: 0 }}>
                          [{commentCount}]
                        </span>
                      )}

                      {/* 🌟 관리자 전용 텍스트 미리보기 버튼 */}
                      {isAdmin && (
                        <button 
                          onClick={(e) => {
                            e.preventDefault(); // 페이지 이동 방지
                            setPreviewPuzzle(p);
                          }}
                          style={{ background: "none", border: "none", color: "#2196F3", fontSize: "12px", marginLeft: "8px", cursor: "pointer", textDecoration: "underline", flexShrink: 0, padding: 0 }}
                        >
                          (미리보기)
                        </button>
                      )}
                    </div>
                    {/* 🌟 모바일 전용: 작성자/날짜/조회/추천 압축 표시 */}
                    <div className="post-meta-mobile">
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "3px" }}><AuthorBadge author={p.author || "익명"} info={authorInfo[p.author]} /></span>
                      <span>·</span>
                      <span>{formatDate(p.created_at)}</span>
                      <span>·</span>
                      <span>조회 {p.views || 0}</span>
                      <span>·</span>
                      <span>👍 {likeCount}</span>
                    </div>
                  </div>
                  
                  <div className="col-author">
                    <AuthorBadge author={p.author || '익명'} info={authorInfo[p.author]} />
                  </div>
                  <div className="col-date">{formatDate(p.created_at)}</div>
                  <div className="col-views">{p.views || 0}</div>
                  <div className="col-likes">👍 {likeCount}</div>
                </Link>
              </li>
            );
          })
        )}
      </ul>

      {/* 🌟 10개씩 자르는 페이지네이션 버튼 영역 추가 */}
      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: "6px", marginTop: "25px", marginBottom: "10px" }}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
            <button
              key={pageNum}
              onClick={() => setCurrentPage(pageNum)}
              style={{
                padding: "6px 12px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                backgroundColor: currentPage === pageNum ? "#2196F3" : "#fff",
                color: currentPage === pageNum ? "#fff" : "#333",
                cursor: "pointer",
                fontWeight: currentPage === pageNum ? "bold" : "normal",
                transition: "all 0.2s"
              }}
            >
              {pageNum}
            </button>
          ))}
        </div>
      )}

      {/* 🌟 관리자 전용 미리보기 팝업(모달) 창 */}
      {previewPuzzle && (
        <div 
          style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0,0,0,0.6)", zIndex: 10000, display: "flex", justifyContent: "center", alignItems: "center" }}
          onClick={() => setPreviewPuzzle(null)} // 바깥 여백 클릭 시 닫힘
        >
          <div 
            style={{ backgroundColor: "#fff", padding: "25px", borderRadius: "8px", maxWidth: "90vw", maxHeight: "90vh", overflow: "auto", boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}
            onClick={(e) => e.stopPropagation()} // 내부 클릭 시 닫힘 방지
          >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #ddd", paddingBottom: "10px", marginBottom: "20px" }}>
              <h3 style={{ margin: 0, color: "#333", fontSize: "18px" }}>🔎 {previewPuzzle.title} ({previewPuzzle.width}x{previewPuzzle.height})</h3>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {isAdmin && !previewPuzzle.is_approved && (
                  <button
                    onClick={() => handleApprove(previewPuzzle.id, previewPuzzle.title)}
                    style={{ background: "#4CAF50", color: "#fff", border: "none", borderRadius: "4px", padding: "6px 12px", fontSize: "13px", fontWeight: "bold", cursor: "pointer" }}
                  >
                    ✅ 승인하기
                  </button>
                )}
                {isAdmin && (
                  <button
                    onClick={() => handleDeletePuzzle(previewPuzzle.id, previewPuzzle.title)}
                    style={{ background: "#f44336", color: "#fff", border: "none", borderRadius: "4px", padding: "6px 12px", fontSize: "13px", fontWeight: "bold", cursor: "pointer" }}
                  >
                    🗑️ 삭제하기
                  </button>
                )}
                <button onClick={() => setPreviewPuzzle(null)} style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#999", padding: "0 5px" }}>×</button>
              </div>
            </div>
            
            <div style={{ display: "flex", justifyContent: "center" }}>
              <PreviewCanvas width={previewPuzzle.width} height={previewPuzzle.height} data={previewPuzzle.data} maxSize={400} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}