"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabaseClient";
import KakaoAd from "../../components/KakaoAd";
import { makeSlug } from "@/lib/slug";



export default function MakePuzzlePage() {
  const router = useRouter();
  const supabase = createClient();

  // 유저 및 상태 관리
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [inputWidth, setInputWidth] = useState(10);
  const [inputHeight, setInputHeight] = useState(10);
  
  // 그리드 및 기타 상태 관리
  const [currentWidth, setCurrentWidth] = useState(10);
  const [currentHeight, setCurrentHeight] = useState(10);
  const [userGrid, setUserGrid] = useState<number[]>([]);
  const [zoomFactor, setZoomFactor] = useState(1.0);
  const [isFullscreen, setIsFullscreen] = useState(false); // 🌟 전체화면 상태

  // 드래그 상태 추적용
  const dragInfo = useRef({
    isDragging: false,
    action: 0,
    startIndex: -1,
    axis: null as "row" | "col" | null, // 🌟 툴팁 계산을 위한 축(방향) 추가
    initialGrid: [] as number[],
  });

  const gridRef = useRef<HTMLDivElement>(null);
  const playAreaRef = useRef<HTMLDivElement>(null); // 🌟 전체화면 영역 이름표
  const tooltipRef = useRef<HTMLDivElement>(null);  // 🌟 툴팁 이름표

  // 로그인 세션 확인
  useEffect(() => {
    const checkAuth = async () => {
      // 🌟 getSession 대신 확실한 getUser()로 쿠키 확인!
      const { data: { user } } = await supabase.auth.getUser(); 
      
      if (!user) {
        alert("퍼즐 만들기는 로그인 후 이용할 수 있습니다!");
        return router.push("/");
      }

      const email = user.email;
      const { data: userData } = await supabase.from("user_ids").select("nickname, custom_id").eq("email", email).maybeSingle();
      
      const nickname = userData?.nickname || user.user_metadata?.nickname || user.user_metadata?.custom_id || "익명";
      const isAdmin = nickname === "주인장" || userData?.custom_id === "admin";
      
      setCurrentUser({ email, nickname, isAdmin });
    };
    checkAuth();
  }, [router]);

  // 🌟 전체화면 감지 이벤트
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!(document.fullscreenElement || (document as any).webkitFullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
    };
  }, []);

  // 모바일 드래그 시 스크롤 차단 엔진
  useEffect(() => {
    const gridEl = gridRef.current;
    if (!gridEl) return;

    const preventScrollOnDrag = (e: TouchEvent) => {
      if (dragInfo.current.isDragging) {
        e.preventDefault(); 
      }
    };

    gridEl.addEventListener("touchmove", preventScrollOnDrag, { passive: false });
    return () => gridEl.removeEventListener("touchmove", preventScrollOnDrag);
  }, []);

  // 🌟 마우스 떼면 드래그 종료 및 툴팁 숨김
  useEffect(() => {
    const handlePointerUp = () => { 
      dragInfo.current.isDragging = false; 
      if (tooltipRef.current) tooltipRef.current.style.display = "none";
    };
    window.addEventListener("mouseup", handlePointerUp);
    window.addEventListener("touchend", handlePointerUp);
    return () => {
      window.removeEventListener("mouseup", handlePointerUp);
      window.removeEventListener("touchend", handlePointerUp);
    };
  }, []);

  // 크기 확정 후 새로 시작
  const confirmSize = () => {
    const w = parseInt(String(inputWidth), 10);
    const h = parseInt(String(inputHeight), 10);
    if (isNaN(w) || isNaN(h) || w < 5 || w > 80 || h < 5 || h > 80) {
      alert("5 ~ 80 사이로 입력해주세요.");
      return;
    }
    setCurrentWidth(w);
    setCurrentHeight(h);
    setUserGrid(new Array(w * h).fill(0));
    setIsModalOpen(false);
  };

  // 🌟 드래그 그리기 로직 & 툴팁 계산
  const applyLineDrag = (currentIndex: number, clientX: number, clientY: number) => {
    const { startIndex, action, initialGrid } = dragInfo.current;
    if (startIndex === -1) return;

    const startR = Math.floor(startIndex / currentWidth);
    const startC = startIndex % currentWidth;
    const currR = Math.floor(currentIndex / currentWidth);
    const currC = currentIndex % currentWidth;

    // 가로/세로 방향 결정
    if (dragInfo.current.axis === null) {
      if (Math.abs(currR - startR) >= Math.abs(currC - startC) && Math.abs(currR - startR) > 0) dragInfo.current.axis = "row";
      else if (Math.abs(currC - startC) > Math.abs(currR - startR) && Math.abs(currC - startC) > 0) dragInfo.current.axis = "col";
    }

    const newGrid = [...initialGrid];
    const axis = dragInfo.current.axis;

    if (axis === "row") {
      const minR = Math.min(startR, currR), maxR = Math.max(startR, currR);
      for (let r = minR; r <= maxR; r++) newGrid[r * currentWidth + startC] = action;
    } else if (axis === "col") {
      const minC = Math.min(startC, currC), maxC = Math.max(startC, currC);
      for (let c = minC; c <= maxC; c++) newGrid[startR * currentWidth + c] = action;
    } else {
      newGrid[currentIndex] = action;
    }

    setUserGrid(newGrid);

    // 🌟 툴팁 업데이트 로직
    if (tooltipRef.current) {
      tooltipRef.current.style.left = clientX + "px";
      tooltipRef.current.style.top = clientY + "px";
      tooltipRef.current.style.display = "block";

      const currentDragCount = axis === "row" ? Math.abs(currR - startR) + 1 : axis === "col" ? Math.abs(currC - startC) + 1 : Math.max(Math.abs(currR - startR), Math.abs(currC - startC)) + 1;

      // 전체 연결된 칸 수 계산
      let totalConnectedCount = 0;
      if (axis === "row" || !axis) {
        let tr = startR;
        while(tr >= 0 && newGrid[tr * currentWidth + startC] === action) { totalConnectedCount++; tr--; }
        tr = startR + 1;
        while(tr < currentHeight && newGrid[tr * currentWidth + startC] === action) { totalConnectedCount++; tr++; }
      } else if (axis === "col") {
        let tc = startC;
        while(tc >= 0 && newGrid[startR * currentWidth + tc] === action) { totalConnectedCount++; tc--; }
        tc = startC + 1;
        while(tc < currentWidth && newGrid[startR * currentWidth + tc] === action) { totalConnectedCount++; tc++; }
      }

      if (currentDragCount === totalConnectedCount || totalConnectedCount === 0) {
        tooltipRef.current.innerText = `${currentDragCount}`;
      } else {
        tooltipRef.current.innerText = `${currentDragCount}/${totalConnectedCount}`;
      }
    }
  };

  const handlePointerDown = (index: number, e: any) => {
    e.preventDefault();
    const isFilled = userGrid[index] === 1;
    const action = isFilled ? 0 : 1; 
    
    // 축(axis)을 null로 초기화하여 새 방향을 잡도록 준비
    dragInfo.current = { isDragging: true, action, startIndex: index, axis: null, initialGrid: [...userGrid] };
    
    const newGrid = [...userGrid];
    newGrid[index] = action;
    setUserGrid(newGrid);
  };

  const handlePointerEnter = (index: number, e: any) => {
    if (!dragInfo.current.isDragging) return;
    applyLineDrag(index, e.clientX, e.clientY);
  };

  const handleTouchMove = (e: any) => {
    if (!dragInfo.current.isDragging) return;
    const touch = e.touches[0];
    const targetCell = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement;
    if (targetCell && targetCell.dataset.index) {
      applyLineDrag(parseInt(targetCell.dataset.index, 10), touch.clientX, touch.clientY);
    }
  };

  // 🌟 전체화면 토글 함수
  const toggleFullScreen = () => {
    const el = playAreaRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      if (el.requestFullscreen) el.requestFullscreen();
      else if ((el as any).webkitRequestFullscreen) (el as any).webkitRequestFullscreen();
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
      else if ((document as any).webkitExitFullscreen) (document as any).webkitExitFullscreen();
    }
  };

  const saveMakerProgress = () => {
    if (userGrid.length === 0) return alert("그리드가 없습니다. 먼저 퍼즐 크기를 설정해주세요.");
    const draft = { width: currentWidth, height: currentHeight, data: userGrid };
    localStorage.setItem('nonogram_draft', JSON.stringify(draft));
    alert("현재 작업 상태가 임시저장 되었습니다! 💾\n(브라우저를 종료해도 유지됩니다)");
  };

  const loadMakerProgress = () => {
    const draftStr = localStorage.getItem('nonogram_draft');
    if (!draftStr) return alert("저장된 임시 퍼즐 데이터가 없습니다. 📂");
    const draft = JSON.parse(draftStr);
    
    setCurrentWidth(draft.width);
    setCurrentHeight(draft.height);
    setInputWidth(draft.width);
    setInputHeight(draft.height);
    setUserGrid(draft.data);
    setIsModalOpen(false);
    alert("임시저장된 퍼즐을 성공적으로 불러왔습니다! 🎉");
  };

  // DB에 최종 제출 (중복 이름 스마트 자동 넘버링)
  const savePuzzle = async () => {
    if (!userGrid.includes(1)) return alert("빈 그림은 저장할 수 없습니다!");

    let title = prompt("퍼즐의 이름을 입력하세요:", "새 퍼즐");
    if (!title) return;
    let finalTitle = title;
    const { data: existingPuzzle } = await supabase.from('puzzles').select('title').eq('title', title).maybeSingle();
    
    if (existingPuzzle) {
      const randomTag = Math.floor(1000 + Math.random() * 9000);
      finalTitle = `${title} #${randomTag}`;
      alert(`💡 이미 같은 이름이 있어서 '${finalTitle}'(으)로 자동 변경되어 저장됩니다.`);
    }

    // 🌟 slug 생성 (중복 시 -2, -3 붙여 재시도)
    const baseSlug = makeSlug(finalTitle, currentWidth, currentHeight, crypto.randomUUID());
    let slug = baseSlug;
    let attempt = 2;
    let error = null;

    while (true) {
      const res = await supabase.from('puzzles').insert([{ 
          title: finalTitle, 
          data: userGrid, 
          width: currentWidth, 
          height: currentHeight, 
          is_approved: currentUser.isAdmin, 
          views: 0,
          author: currentUser.nickname,
          slug
      }]);

      // 유니크 제약 위반이면 번호를 올려 재시도
      if (res.error?.code === '23505' && attempt <= 20) {
        slug = `${baseSlug}-${attempt++}`;
        continue;
      }

      error = res.error;
      break;
    }

    if (error) {
      alert("저장 실패: " + error.message);
    } else {
      alert(currentUser.isAdmin ? "성공적으로 등록되었습니다!" : "퍼즐이 제출되었습니다! 관리자 승인 후 목록에 표시됩니다.");
      router.push('/all-puzzles');
      router.refresh();
    }
  };

  const cellSize = Math.max(10, 30 * zoomFactor);

  if (!currentUser) return <div style={{ padding: "50px", textAlign: "center" }}>사용자 정보를 확인 중입니다...</div>;

  return (
    <div className="view active" style={{ display: "block", position: "relative" }}>

      {/* 📢 기기별 맞춤 카카오 애드핏 광고DAN-K4gZlnAmDITkywyy
      DAN-z2i2KQMpyEbevIDZ시작 */}
      <div style={{ marginTop: "15px", marginBottom: "15px" }}>
              <div className="ad-pc">
                <KakaoAd unit="DAN-K4gZlnAmDITkywyy" width="728" height="90" />
              </div>
      
              <div className="ad-mobile">
                <KakaoAd unit="DAN-z2i2KQMpyEbevIDZ" width="320" height="100" />
              </div>
            </div>
            {/* 📢 카카오 애드핏 광고 끝 */}
      
      {/* 크기 입력 모달 */}
      {isModalOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 2000 }}>
          <div style={{ background: "white", padding: "30px", borderRadius: "8px", textAlign: "center", width: "90%", maxWidth: "400px" }}>
            <h3 style={{ margin: "0 0 10px 0" }}>새 퍼즐 만들기</h3>
            <p style={{ fontSize: "14px", color: "#666", marginBottom: "20px" }}>가로와 세로 칸 수를 입력하세요 (5 ~ 80)</p>
            <input type="number" min="5" max="80" value={inputWidth} onChange={(e) => setInputWidth(Number(e.target.value))} placeholder="가로 크기" style={{ width: "90%", fontSize: "16px", padding: "10px", margin: "10px 0", border: "1px solid #ddd", borderRadius: "4px", textAlign: "center", boxSizing: "border-box" }} />
            <input type="number" min="5" max="80" value={inputHeight} onChange={(e) => setInputHeight(Number(e.target.value))} placeholder="세로 크기" style={{ width: "90%", fontSize: "16px", padding: "10px", margin: "10px 0", border: "1px solid #ddd", borderRadius: "4px", textAlign: "center", boxSizing: "border-box" }} />
            
            <div style={{ marginTop: "20px", display: "flex", gap: "8px", justifyContent: "center", flexWrap: "wrap" }}>
              <button onClick={confirmSize} style={{ padding: "10px 20px", fontSize: "15px", cursor: "pointer", backgroundColor: "#2196F3", color: "white", border: "none", borderRadius: "4px", fontWeight: "bold" }}>새로 시작</button>
              <button onClick={loadMakerProgress} style={{ padding: "10px 20px", fontSize: "15px", cursor: "pointer", backgroundColor: "#9C27B0", color: "white", border: "none", borderRadius: "4px", fontWeight: "bold" }}>📂 이어서 만들기</button>
              <button onClick={() => router.push("/")} style={{ padding: "10px 20px", fontSize: "15px", cursor: "pointer", backgroundColor: "#999", color: "white", border: "none", borderRadius: "4px", fontWeight: "bold" }}>취소</button>
            </div>
          </div>
        </div>
      )}

      {/* 🌟 창작 모드 본화면 (전체화면 지원) */}
      {!isModalOpen && (
        <div id="maker-area" ref={playAreaRef} style={{ background: "#f5f6f7", padding: "10px", borderRadius: "8px" }}>
          
          {/* 🌟 전체화면 작동 시 퍼즐 중앙 정렬용 CSS */}
          <style>{`
            #maker-area:fullscreen, #maker-area:-webkit-full-screen {
              background-color: #f5f6f7;
              width: 100vw !important;
              height: 100vh !important;
              display: flex !important;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              padding: 20px;
              box-sizing: border-box;
            }
            #maker-area:fullscreen .section-header {
              display: none !important;
            }
            #maker-area:fullscreen .scroll-wrapper, #maker-area:-webkit-full-screen .scroll-wrapper {
              max-height: 80vh !important;
              max-width: 100vw !important;
              border: none !important;
              background: transparent !important;
              display: flex;
              justify-content: center;
              align-items: center;
            }
          `}</style>

          {/* 🌟 툴팁 박스 추가 */}
          <div id="drag-count-tooltip" ref={tooltipRef} className="drag-tooltip" style={{ position: "fixed", display: "none", background: "#2196F3", color: "white", border: "2px solid white", borderRadius: "50%", width: "32px", height: "32px", textAlign: "center", lineHeight: "28px", fontWeight: "bold", fontSize: "14px", pointerEvents: "none", zIndex: 9999, transform: "translate(15px, -35px)" }}>1</div>

          <div className="section-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", margin: "0 0 15px 0", borderBottom: "1px solid #eee", paddingBottom: "10px" }}>
            <h2 style={{ margin: 0, fontSize: "18px", color: "#111" }}>🛠️ 창작 모드 (<span id="maker-size-text">{currentWidth} x {currentHeight}</span>)</h2>
            <button style={{ background: "none", border: "none", color: "#f44336", fontWeight: "bold", cursor: "pointer" }} onClick={() => router.push("/")}>취소</button>
          </div>

          <div style={{ display: "flex", gap: "8px", alignItems: "center", justifyContent: "center", marginBottom: "15px", background: "#fff", padding: "10px 15px", borderRadius: "6px", border: "1px solid #ddd" }}>
            <span style={{ fontSize: "14px", fontWeight: "bold" }}>🔎 줌: </span>
            <button onClick={() => setZoomFactor(z => Math.min(3.0, z + 0.2))} style={{ padding: "4px 10px", fontSize: "13px", border: "1px solid #bbb", background: "#fff", borderRadius: "4px", cursor: "pointer" }}>+</button>
            <button onClick={() => setZoomFactor(z => Math.max(0.2, z - 0.2))} style={{ padding: "4px 10px", fontSize: "13px", border: "1px solid #bbb", background: "#fff", borderRadius: "4px", cursor: "pointer" }}>-</button>
            <button onClick={() => setZoomFactor(1.0)} style={{ padding: "4px 10px", fontSize: "13px", border: "1px solid #bbb", background: "#fff", borderRadius: "4px", cursor: "pointer" }}>기본</button>
            {/* 🌟 전체화면 버튼 추가 */}
            <button onClick={toggleFullScreen} style={{ marginLeft: "10px", padding: "4px 10px", fontWeight: "bold", backgroundColor: isFullscreen ? "#f44336" : "#2196F3", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
              {isFullscreen ? "↙ 화면 축소" : "⛶ 전체화면"}
            </button>
          </div>

          {/* 스크롤 및 모바일 방지 영역 */}
          <div ref={gridRef} className="scroll-wrapper" style={{ overflow: "auto", maxWidth: "100%", maxHeight: "65vh", padding: "10px", marginBottom: "10px", border: "1px solid #ddd", background: "#fdfdfd" }} onTouchMove={handleTouchMove} onContextMenu={(e) => e.preventDefault()}>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${currentWidth}, ${cellSize}px)`, gridTemplateRows: `repeat(${currentHeight}, ${cellSize}px)`, width: "max-content", border: "2px solid #333", backgroundColor: "white" }}>
              {userGrid.map((cellState, index) => {
                const r = Math.floor(index / currentWidth);
                const c = index % currentWidth;
                const isThickRight = (c + 1) % 5 === 0 && c !== currentWidth - 1;
                const isThickBottom = (r + 1) % 5 === 0 && r !== currentHeight - 1;
                return (
                  <div 
                    key={index}
                    data-index={index}
                    onMouseDown={(e) => handlePointerDown(index, e)}
                    onMouseEnter={(e) => handlePointerEnter(index, e)}
                    onTouchStart={(e) => handlePointerDown(index, e)}
                    style={{
                      width: cellSize, height: cellSize, minWidth: cellSize, minHeight: cellSize, boxSizing: "border-box", border: "1px solid #ccc",
                      borderRight: isThickRight ? "3px solid #333" : "1px solid #ccc",
                      borderBottom: isThickBottom ? "3px solid #333" : "1px solid #ccc",
                      backgroundColor: cellState === 1 ? "#333" : "#fff",
                      userSelect: "none", cursor: "pointer"
                    }}
                  />
                );
              })}
            </div>
          </div>
          
          {/* 하단 저장 버튼 그룹 */}
          <div style={{ marginTop: "20px", display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
            <button onClick={saveMakerProgress} style={{ padding: "10px 20px", fontSize: "15px", cursor: "pointer", backgroundColor: "#FF9800", color: "white", border: "none", borderRadius: "4px", fontWeight: "bold" }}>💾 임시저장</button>
            <button onClick={loadMakerProgress} style={{ padding: "10px 20px", fontSize: "15px", cursor: "pointer", backgroundColor: "#9C27B0", color: "white", border: "none", borderRadius: "4px", fontWeight: "bold" }}>📂 불러오기</button>
            <button onClick={savePuzzle} style={{ padding: "10px 20px", fontSize: "15px", cursor: "pointer", backgroundColor: "#4CAF50", color: "white", border: "none", borderRadius: "4px", fontWeight: "bold" }}>✨ 최종 등록하기</button>
          </div>
        </div>
      )}
    </div>
  );
}