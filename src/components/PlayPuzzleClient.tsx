"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import KakaoAd from "./KakaoAd";
import { createClient } from "../lib/supabaseClient";
import PuzzleComments from "./PuzzleComments";
import { getHint, HintResult } from "../lib/hint";
import ShareButton from "./ShareButton";

export default function PlayPuzzleClient({ puzzle }: { puzzle: any }) {
  const w = puzzle.width;
  const h = puzzle.height;
  const solution = puzzle.data; // 정답 배열

  const [userGrid, setUserGrid] = useState<number[]>(new Array(w * h).fill(0));
  const [history, setHistory] = useState<number[][]>([new Array(w * h).fill(0)]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [isGameCleared, setIsGameCleared] = useState(false);
  const [zoomFactor, setZoomFactor] = useState(1.0);
  const [crossedHints, setCrossedHints] = useState<{ [key: string]: boolean }>({});
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hintUsedCount, setHintUsedCount] = useState(0);

  const [hintCells, setHintCells] = useState<number[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hoverRow, setHoverRow] = useState<number | null>(null);
  const [hoverCol, setHoverCol] = useState<number | null>(null);

  // 🌟 최신 상태 보관 캡슐
  const stateRef = useRef({ history, historyIndex, userGrid, isGameCleared });
  useEffect(() => {
    stateRef.current = { history, historyIndex, userGrid, isGameCleared };
  }, [history, historyIndex, userGrid, isGameCleared]);

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

    useEffect(() => {
    const initHint = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
      if (session) {
        const { data } = await supabase.rpc("get_hint_usage", { p_puzzle_id: puzzle.id });
        if (typeof data === "number") setHintUsedCount(data);
      }
    };
    initHint();
  }, [puzzle.id]);
  
  const dragInfo = useRef({
    isDragging: false,
    action: 0,
    startIndex: -1,
    axis: null as "row" | "col" | null,
    initialGrid: [] as number[],
    hasChanged: false
  });

  const playAreaRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

      // 모바일: 손가락 1개 = 칠하기, 손가락 2개 이상 = 우리가 직접 스크롤 이동시킴
  useEffect(() => {
    const gridEl = gridRef.current;
    if (!gridEl) return;

    let twoFingerMid: { x: number; y: number } | null = null;

    const handleTouchStart = (e: TouchEvent) => {
      if (stateRef.current.isGameCleared) return;

      if (e.touches.length > 1) {
        if (dragInfo.current.isDragging) {
          setUserGrid([...dragInfo.current.initialGrid]); // 찰나에 칠해진 것 되돌리기
        }
        dragInfo.current.isDragging = false;
        if (tooltipRef.current) tooltipRef.current.style.display = "none";
        const t0 = e.touches[0], t1 = e.touches[1];
        twoFingerMid = { x: (t0.clientX + t1.clientX) / 2, y: (t0.clientY + t1.clientY) / 2 };
        return;
      }

      twoFingerMid = null;
      const touch = e.touches[0];
      const targetCell = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement;
      if (!targetCell || !targetCell.dataset.index) return;

      e.preventDefault();
      handlePointerDown(parseInt(targetCell.dataset.index, 10), e);
    };

    const handleTouchMoveNative = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        dragInfo.current.isDragging = false;
        e.preventDefault();
        if (twoFingerMid) {
          const t0 = e.touches[0], t1 = e.touches[1];
          const midX = (t0.clientX + t1.clientX) / 2;
          const midY = (t0.clientY + t1.clientY) / 2;
          gridEl.scrollLeft -= (midX - twoFingerMid.x);
          gridEl.scrollTop -= (midY - twoFingerMid.y);
          twoFingerMid = { x: midX, y: midY };
        }
        return;
      }
      if (!dragInfo.current.isDragging || stateRef.current.isGameCleared) return;
      e.preventDefault();
      const touch = e.touches[0];
      const targetCell = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement;
      if (targetCell && targetCell.dataset.index) {
        applyLineDrag(parseInt(targetCell.dataset.index, 10), touch.clientX, touch.clientY);
      }
    };

    const handleTouchEnd = () => { twoFingerMid = null; };

    gridEl.addEventListener("touchstart", handleTouchStart, { passive: false });
    gridEl.addEventListener("touchmove", handleTouchMoveNative, { passive: false });
    gridEl.addEventListener("touchend", handleTouchEnd);
    gridEl.addEventListener("touchcancel", handleTouchEnd);
    return () => {
      gridEl.removeEventListener("touchstart", handleTouchStart);
      gridEl.removeEventListener("touchmove", handleTouchMoveNative);
      gridEl.removeEventListener("touchend", handleTouchEnd);
      gridEl.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, []);

  const hints = useMemo(() => {
    let rowHints = [], colHints = [];
    for (let r = 0; r < h; r++) {
      let rHints = [], count = 0;
      for (let c = 0; c < w; c++) {
        if (solution[r * w + c] === 1) count++;
        else if (count > 0) { rHints.push(count); count = 0; }
      }
      if (count > 0) rHints.push(count);
      if (rHints.length === 0) rHints.push(0);
      rowHints.push(rHints);
    }
    for (let c = 0; c < w; c++) {
      let cHints = [], count = 0;
      for (let r = 0; r < h; r++) {
        if (solution[r * w + c] === 1) count++;
        else if (count > 0) { cHints.push(count); count = 0; }
      }
      if (count > 0) cHints.push(count);
      if (cHints.length === 0) cHints.push(0);
      colHints.push(cHints);
    }
    return { rowHints, colHints };
  }, [solution, w, h]);

  const solvedStatus = useMemo(() => {
    const solvedRows = new Array(h).fill(true);
    const solvedCols = new Array(w).fill(true);
    for (let r = 0; r < h; r++) {
      for (let c = 0; c < w; c++) {
        const uVal = userGrid[r * w + c] === 1 ? 1 : 0;
        if (solution[r * w + c] !== uVal) {
          solvedRows[r] = false;
          solvedCols[c] = false;
        }
      }
    }
    return { solvedRows, solvedCols };
  }, [userGrid, solution, w, h]);

  useEffect(() => {
    if (isGameCleared) return;
    let newGrid = [...userGrid];
    let changed = false;
    for (let r = 0; r < h; r++) {
      if (solvedStatus.solvedRows[r]) {
        for (let c = 0; c < w; c++) {
          if (solution[r * w + c] === 0 && newGrid[r * w + c] === 0) {
            newGrid[r * w + c] = 2; changed = true;
          }
        }
      }
    }
    for (let c = 0; c < w; c++) {
      if (solvedStatus.solvedCols[c]) {
        for (let r = 0; r < h; r++) {
          if (solution[r * w + c] === 0 && newGrid[r * w + c] === 0) {
            newGrid[r * w + c] = 2; changed = true;
          }
        }
      }
    }
    if (changed) setUserGrid(newGrid);
  }, [solvedStatus, isGameCleared]);

  useEffect(() => {
    if (isGameCleared) return;
    const isWin = solution.every((val: number, i: number) => val === (userGrid[i] === 1 ? 1 : 0));
    if (isWin) {
      setIsGameCleared(true);
      const completed = JSON.parse(localStorage.getItem("completed_nonograms") || "[]");
      if (!completed.includes(puzzle.id)) {
        completed.push(puzzle.id);
        localStorage.setItem("completed_nonograms", JSON.stringify(completed));
      }
      localStorage.removeItem("progress_" + puzzle.id);

      // 🌟 [추가됨] Supabase DB에 '클리어' 기록 쏘기
      const recordClearToDB = async () => {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          // completed_puzzles 테이블에 기록 (이미 깬 퍼즐이면 에러가 나지만 조용히 무시됨)
          await supabase.from('completed_puzzles').insert({
            puzzle_id: puzzle.id,
            user_id: session.user.id
          });
        }
      };
      recordClearToDB();
    }
  }, [userGrid, solution, isGameCleared, puzzle.id]);

  const applyLineDrag = (currentIndex: number, clientX: number, clientY: number) => {
    const { startIndex, action, initialGrid } = dragInfo.current;
    if (startIndex === -1) return;
    
    const startR = Math.floor(startIndex / w), startC = startIndex % w;
    const currR = Math.floor(currentIndex / w), currC = currentIndex % w;
    const rDiff = Math.abs(currR - startR), cDiff = Math.abs(currC - startC);
    
    if (dragInfo.current.axis === null) {
      if (rDiff >= cDiff && rDiff > 0) dragInfo.current.axis = "row";
      else if (cDiff > rDiff && cDiff > 0) dragInfo.current.axis = "col";
    }
    
    const newGrid = [...initialGrid];
    const axis = dragInfo.current.axis;
    
    if (axis === "row") {
      const minR = Math.min(startR, currR), maxR = Math.max(startR, currR);
      for (let r = minR; r <= maxR; r++) newGrid[r * w + startC] = action;
    } else if (axis === "col") {
      const minC = Math.min(startC, currC), maxC = Math.max(startC, currC);
      for (let c = minC; c <= maxC; c++) newGrid[startR * w + c] = action;
    } else {
      newGrid[currentIndex] = action;
    }
    
    setUserGrid(newGrid);
    dragInfo.current.hasChanged = true;

    if (tooltipRef.current) {
      const currentDragCount = axis === "row" ? Math.abs(currR - startR) + 1 : axis === "col" ? Math.abs(currC - startC) + 1 : Math.max(Math.abs(currR - startR), Math.abs(currC - startC)) + 1;
      let totalConnectedCount = 0;
      if (axis === "row" || !axis) { 
        let tr = startR;
        while(tr >= 0 && newGrid[tr * w + startC] === action) { totalConnectedCount++; tr--; }
        tr = startR + 1;
        while(tr < h && newGrid[tr * w + startC] === action) { totalConnectedCount++; tr++; }
      } else if (axis === "col") { 
        let tc = startC;
        while(tc >= 0 && newGrid[startR * w + tc] === action) { totalConnectedCount++; tc--; }
        tc = startC + 1;
        while(tc < w && newGrid[startR * w + tc] === action) { totalConnectedCount++; tc++; }
      }
      const tooltipText = (currentDragCount === totalConnectedCount || totalConnectedCount === 0) ? `${currentDragCount}` : `${currentDragCount}/${totalConnectedCount}`;
      
      tooltipRef.current.style.left = clientX + "px";
      tooltipRef.current.style.top = clientY + "px";
      tooltipRef.current.innerText = tooltipText;
      tooltipRef.current.style.display = "block";
    }
  };

   const handlePointerDown = (index: number, e: any) => {
    if (stateRef.current.isGameCleared) return;
    if (e.pointerType === "touch") return; // 터치는 아래 useEffect의 네이티브 리스너가 전담 처리
    e.preventDefault();
    const isRightClick = e.button === 2 || e.type === "contextmenu";
    const currentGrid = stateRef.current.userGrid;
    const cellState = currentGrid[index];
    const action = isRightClick ? (cellState === 2 ? 0 : 2) : (cellState === 0 ? 1 : cellState === 1 ? 2 : 0);
    
    dragInfo.current = { isDragging: true, action, startIndex: index, axis: null, initialGrid: [...currentGrid], hasChanged: true };
    const newGrid = [...currentGrid];
    newGrid[index] = action;
    setUserGrid(newGrid);

    if (tooltipRef.current) {
      let clientX = e.clientX;
      let clientY = e.clientY;
      if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      }
      if (clientX !== undefined && clientY !== undefined) {
        tooltipRef.current.style.left = clientX + "px";
        tooltipRef.current.style.top = clientY + "px";
        tooltipRef.current.innerText = "1";
        tooltipRef.current.style.display = "block";
      }
    }
  };

  const handlePointerEnter = (index: number, e: any) => {
    if (!dragInfo.current.isDragging || isGameCleared) return;
    applyLineDrag(index, e.clientX, e.clientY);
  };



  // 🌟 가장 깨끗하고 완벽한 마우스 해제 로직
  const handleGlobalUp = () => {
    // 무조건 툴팁 숨기기
    if (tooltipRef.current) tooltipRef.current.style.display = "none";

    // 드래그 기록 저장
    if (dragInfo.current.isDragging) {
      const { history: h, historyIndex: hIdx, userGrid: ug, isGameCleared: cleared } = stateRef.current;
      if (!cleared && dragInfo.current.hasChanged) {
        const newHistory = h.slice(0, hIdx + 1);
        newHistory.push([...ug]);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
      }
    }
    dragInfo.current.isDragging = false;
  };

  // 일반 모드에서 화면 밖으로 마우스가 나갔을 때를 대비한 안전장치
  useEffect(() => {
    window.addEventListener("pointerup", handleGlobalUp);
    window.addEventListener("touchend", handleGlobalUp);
    return () => {
      window.removeEventListener("pointerup", handleGlobalUp);
      window.removeEventListener("touchend", handleGlobalUp);
    };
  }, []);

  const undo = () => { if (historyIndex > 0 && !isGameCleared) { setHistoryIndex(h => h - 1); setUserGrid([...history[historyIndex - 1]]); } };
  const redo = () => { if (historyIndex < history.length - 1 && !isGameCleared) { setHistoryIndex(h => h + 1); setUserGrid([...history[historyIndex + 1]]); } };
  const saveProgress = () => { localStorage.setItem("progress_" + puzzle.id, JSON.stringify(userGrid)); alert("임시 저장되었습니다!"); };
  const loadProgress = () => {
    const saved = localStorage.getItem("progress_" + puzzle.id);
    if (!saved) { alert("저장된 내용이 없습니다."); return; }
    const loadedGrid = JSON.parse(saved);
    setUserGrid(loadedGrid);
    setHistory([[...loadedGrid]]);
    setHistoryIndex(0);
    setIsGameCleared(false);
    alert("불러왔습니다!");
  };
  
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


    const MAX_FREE_HINTS = 10;

  const handleHint = async () => {
    if (isGameCleared) return;

    if (!isLoggedIn) {
      alert("힌트는 로그인 후 이용할 수 있습니다.");
      return;
    }

    const supabase = createClient();
    const { data: newCount, error } = await supabase.rpc("use_puzzle_hint", {
      p_puzzle_id: puzzle.id,
      p_max_free: MAX_FREE_HINTS,
    });

    if (error) {
      alert("힌트 사용 중 오류가 발생했습니다: " + error.message);
      return;
    }
    if (newCount === -1) {
      alert(`무료 힌트를 모두 사용하셨습니다! (${MAX_FREE_HINTS}개)\n광고를 보고 힌트를 더 받는 기능은 준비 중입니다.`);
      return;
    }

    setHintUsedCount(newCount);

    const result: HintResult = getHint({ width: w, height: h, data: solution }, userGrid);

    let cellsToFill: { index: number; value: 1 | 2 }[] = [];

    if (result.type === "fixMistake") {
      // 실수 하나를 정답으로 고쳐줌
      cellsToFill = [{ index: result.index, value: result.value }];
    } else if (result.type === "reveal") {
      // 한 줄(행 또는 열)에서 확정되는 칸들을 통째로 채움
      cellsToFill = result.cells;
    } else {
      // 라인 로직으로 더 못 찾으면, 아직 안 채운 칸 중 "칠할 칸(1)"을 우선으로 무작위 하나 공개
      const unknownFilled: number[] = [];
      const unknownEmpty: number[] = [];
      for (let i = 0; i < userGrid.length; i++) {
        if (userGrid[i] !== 0) continue;
        if (solution[i] === 1) unknownFilled.push(i);
        else unknownEmpty.push(i);
      }
      const pool = unknownFilled.length > 0 ? unknownFilled : unknownEmpty;
      if (pool.length === 0) return; // 이미 다 채워진 상태
      const idx = pool[Math.floor(Math.random() * pool.length)];
      cellsToFill = [{ index: idx, value: solution[idx] === 1 ? 1 : 2 }];
    }

    const newGrid = [...userGrid];
    for (const { index, value } of cellsToFill) newGrid[index] = value;
    setUserGrid(newGrid);
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...newGrid]);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);

    setHintCells(cellsToFill.map((c) => c.index));
    setTimeout(() => setHintCells([]), 1500);
  };

  const cellSize = Math.max(10, 30 * zoomFactor);
  const hintFont = Math.max(8, 16 * zoomFactor);
  const markFont = Math.max(8, 18 * zoomFactor);

  return (
    <div 
      id="play-area" 
      ref={playAreaRef} 
      style={{ background: "#f5f6f7", padding: "10px", borderRadius: "8px", userSelect: "none" }} 
      onContextMenu={e => e.preventDefault()}
      // 🌟 전체화면 박스 자체에 마우스를 떼거나 영역을 벗어날 때의 이벤트를 묶었습니다.
      onPointerUp={handleGlobalUp}
      onPointerLeave={handleGlobalUp}
      onPointerCancel={handleGlobalUp}
    >
      
      <style>{`
        #play-area:fullscreen, #play-area:-webkit-full-screen {
          background-color: #f5f6f7;
          width: 100vw !important;
          height: 100vh !important;
          display: flex !important;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start !important;
          padding: 20px;
          box-sizing: border-box;
          overflow-y: auto !important;
        }
        #play-area:fullscreen .seo-guide-box, #play-area:-webkit-full-screen .seo-guide-box {
          display: none !important;
        }
        #play-area:fullscreen .puzzle-comments-box, #play-area:-webkit-full-screen .puzzle-comments-box {
          display: none !important;
        }

        #play-area:fullscreen .read-content, #play-area:-webkit-full-screen .read-content {
  display: none !important;
}
        #play-area:fullscreen .scroll-wrapper, #play-area:-webkit-full-screen .scroll-wrapper {
          max-height: none !important;
          max-width: 100vw !important;
          border: none !important;
          background: transparent !important;
          display: block !important;
        }

        .drag-tooltip {
          position: fixed;
          display: none;
          background-color: #2196F3;
          color: white;
          border: 2px solid white;
          border-radius: 20px;
          padding: 0 10px;
          min-width: 32px;
          width: max-content;
          height: 32px;
          box-sizing: border-box;
          text-align: center;
          line-height: 28px;
          font-weight: bold;
          font-size: 14px;
          pointer-events: none;
          z-index: 9999;
          transform: translate(15px, -35px);
          white-space: nowrap;
        }
                  @keyframes mistakeBlink {
          0%, 100% { background-color: #ff5252; }
          50% { background-color: #ffcdd2; }
        }
        .cell-mistake-blink {
          animation: mistakeBlink 0.4s ease-in-out infinite;
        }
        #play-area:fullscreen .toolbar-bar, #play-area:-webkit-full-screen .toolbar-bar {
          display: flex !important; /* 🌟 전체화면에서도 버튼들이 한 줄에 나오도록 flex 유지 */
          flex-wrap: nowrap !important;
        }
        @media (max-width: 480px) {
  .toolbar-bar button { padding: 6px 8px !important; font-size: 13px !important; }
  .toolbar-bar .btn-label { display: none; }
}  
      `}</style>

      <div id="drag-count-tooltip" ref={tooltipRef} className="drag-tooltip">1</div>
      
       <div className="toolbar-bar" style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "center", gap: "8px", marginBottom: "15px", background: "#fff", padding: "10px 15px", borderRadius: "6px", border: "1px solid #ddd" }}>
        <span style={{ fontSize: "14px", fontWeight: "bold" }}>🔎  </span>
        <button onClick={() => setZoomFactor(z => Math.min(3.0, z + 0.2))} style={{ padding: "4px 10px", fontSize: "13px", border: "1px solid #bbb", background: "#fff", borderRadius: "4px", cursor: "pointer" }}>+</button>
        <button onClick={() => setZoomFactor(z => Math.max(0.2, z - 0.2))} style={{ padding: "4px 10px", fontSize: "13px", border: "1px solid #bbb", background: "#fff", borderRadius: "4px", cursor: "pointer" }}>-</button>
        <button onClick={() => setZoomFactor(1.0)} style={{ padding: "4px 10px", fontSize: "13px", border: "1px solid #bbb", background: "#fff", borderRadius: "4px", cursor: "pointer" }}>기본</button>
        <button onClick={toggleFullScreen} title="전체화면" style={{ marginLeft: "10px", padding: "4px 10px", fontWeight: "bold", backgroundColor: "#2196F3", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>⛶ <span className="btn-label">전체화면</span></button>
        <button onClick={undo} title="취소" style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", padding: "8px 14px", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", color: "white", backgroundColor: "#607D8B" }}>↩ <span className="btn-label">취소</span></button>
        <button onClick={redo} title="다시" style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", padding: "8px 14px", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", color: "white", backgroundColor: "#607D8B" }}>↪ <span className="btn-label">다시</span></button>
        <button onClick={saveProgress} title="임시저장" style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", padding: "8px 14px", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", color: "white", backgroundColor: "#FF9800" }}>💾 <span className="btn-label">임시저장</span></button>
        <button onClick={loadProgress} title="불러오기" style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", padding: "8px 14px", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", color: "white", backgroundColor: "#9C27B0" }}>📂 <span className="btn-label">불러오기</span></button>
                <button onClick={handleHint} title="힌트" style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", padding: "8px 14px", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer", color: "white", backgroundColor: "#E91E63" }}>
          💡 <span className="btn-label">힌트 ({MAX_FREE_HINTS - hintUsedCount})</span>
        </button>
      </div>

            <div ref={gridRef} className="scroll-wrapper" style={{ overflow: "auto", maxWidth: "100%", maxHeight: "65vh", padding: "10px", marginBottom: "10px", border: "1px solid #ddd", background: "#fdfdfd" }}>
        <div style={{ display: "grid", gridTemplateColumns: `auto max-content`, gridTemplateRows: `auto max-content`, width: "max-content", border: "3px solid #111", backgroundColor: "#e4e4e4" }}>
          <div style={{ borderRight: "3px solid #111", borderBottom: "3px solid #111" }}></div>
          
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${w}, ${cellSize}px)`, alignItems: "end", justifyItems: "center", textAlign: "center", fontWeight: "bold", fontSize: `${hintFont}px`, paddingTop: "10px", borderBottom: "3px solid #111" }}>
            {hints.colHints.map((cHint, c) => (
              <div key={`c-${c}`} style={{ color: solvedStatus.solvedCols[c] ? "#aaa" : (c === hoverCol ? "#e53935" : "#000"), display: "flex", flexDirection: "column", justifyContent: "flex-end", height: "100%" }}>
                {cHint.map((num, idx) => {
                  const key = `c-${c}-${idx}`;
                  return (
                    <span key={key} style={{ cursor: "pointer", textDecoration: crossedHints[key] ? "line-through" : "none", opacity: crossedHints[key] ? 0.4 : 1, lineHeight: "1.2" }} onClick={() => !isGameCleared && setCrossedHints(p => ({...p, [key]: !p[key]}))}>
                      {num}
                    </span>
                  );
                })}
              </div>
            ))}
          </div>
          
          <div style={{ display: "grid", gridTemplateRows: `repeat(${h}, ${cellSize}px)`, justifyItems: "end", alignItems: "center", fontWeight: "bold", fontSize: `${hintFont}px`, paddingLeft: "10px", paddingRight: "5px", borderRight: "3px solid #111" }}>
            {hints.rowHints.map((rHint, r) => (
              <div key={`r-${r}`} style={{ color: solvedStatus.solvedRows[r] ? "#aaa" : (r === hoverRow ? "#e53935" : "#000"), display: "flex", flexDirection: "row", justifyContent: "flex-end", alignItems: "center", width: "100%" }}>
                {rHint.map((num, idx) => {
                  const key = `r-${r}-${idx}`;
                  return (
                    <span key={key} style={{ cursor: "pointer", textDecoration: crossedHints[key] ? "line-through" : "none", opacity: crossedHints[key] ? 0.4 : 1, marginLeft: "5px" }} onClick={() => !isGameCleared && setCrossedHints(p => ({...p, [key]: !p[key]}))}>
                      {num}
                    </span>
                  );
                })}
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: `repeat(${w}, ${cellSize}px)`, gridTemplateRows: `repeat(${h}, ${cellSize}px)` }} onMouseLeave={() => { setHoverRow(null); setHoverCol(null); }}>
            {userGrid.map((cellState, index) => {
              const r = Math.floor(index / w);
              const c = index % w;
              const isThickRight = (c + 1) % 5 === 0 && c !== w - 1;
              const isThickBottom = (r + 1) % 5 === 0 && r !== h - 1;
              const isHinted = hintCells.includes(index);
              return (
                <div 
                  key={index}
                  data-index={index}
                  className="cell"
                  onPointerDown={(e) => handlePointerDown(index, e)}
                  onPointerEnter={(e) => handlePointerEnter(index, e)}
                  onMouseEnter={() => { setHoverRow(r); setHoverCol(c); }}
                  style={{
                    width: cellSize, height: cellSize, boxSizing: "border-box", border: "1px solid #ccc",
                    borderRight: isThickRight ? "3px solid #333" : "1px solid #ccc",
                    borderBottom: isThickBottom ? "3px solid #333" : "1px solid #ccc",
                    backgroundColor: isHinted ? "#FFEB3B" : (cellState === 1 ? "#333" : "#fff"),
                    color: cellState === 2 ? (isGameCleared ? "white" : "black") : "transparent",
                    textAlign: "center", lineHeight: `${cellSize}px`, fontSize: `${markFont}px`, fontWeight: "bold",
                    userSelect: "none", cursor: "pointer"
                  }}
                >
                  {cellState === 2 ? "X" : ""}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <h3 style={{ color: "#E91E63", textAlign: "center", minHeight: "30px", margin: "10px 0" }}>
        {isGameCleared ? "🎉 정답입니다!" : ""}
      </h3>

      <div className="seo-guide-box" style={{ marginTop: "20px", padding: "15px", border: "1px solid #eee", backgroundColor: "#fafafa", borderRadius: "6px", fontSize: "13px", color: "#555" }}>
        <h4 style={{ margin: "0 0 5px 0" }}>🎮 조작 가이드</h4>
        - <b>좌클릭 / 터치:</b> 칸을 칠합니다 (마우스를 드래그하여 여러 칸을 한 번에 칠할 수 있습니다).<br/>
        - <b>우클릭:</b> 빈칸임을 표시하는 엑스(X) 마크를 남깁니다.<br/>
        - <b>힌트 숫자 클릭:</b> 완료한 힌트에 취소선을 그어 보기 쉽게 관리할 수 있습니다.
      </div>


      {puzzle.content && (
        <div className="read-content" style={{ marginTop: "20px", padding: "20px", borderTop: "1px solid #eee", background: "#fff", borderRadius: "8px", userSelect: "text" }} dangerouslySetInnerHTML={{ __html: puzzle.content }} />
      )}

      <PuzzleComments puzzle={puzzle} isGameCleared={isGameCleared} />

      

      {isFullscreen && (
        <div style={{ marginTop: "20px", width: "100%", display: "flex", justifyContent: "center", paddingBottom: "30px" }}>
          <div>
            <div className="ad-pc">
              <KakaoAd unit="DAN-PmtHgQAd8c5EQtcy" width="728" height="90" />
            </div>
            <div className="ad-mobile">
              <KakaoAd unit="DAN-lsUhERRXp3RaORnD" width="320" height="100" />
            </div>
          </div>
        </div>
      )}

      
    </div>
    
  );
}