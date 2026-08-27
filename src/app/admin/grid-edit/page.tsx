"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../../lib/supabaseClient";

export default function AdminGridEditPage() {
  const router = useRouter();
  const supabase = createClient();

  const [isLoading, setIsLoading] = useState(true);

  // 입력 화면 상태
  const [jsonInput, setJsonInput] = useState("");
  const [inputWidth, setInputWidth] = useState(10);
  const [inputHeight, setInputHeight] = useState(10);

  // 편집 화면 상태
  const [isGridLoaded, setIsGridLoaded] = useState(false);
  const [currentWidth, setCurrentWidth] = useState(10);
  const [currentHeight, setCurrentHeight] = useState(10);
  const [userGrid, setUserGrid] = useState<number[]>([]);
  const [zoomFactor, setZoomFactor] = useState(1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 저장(선택사항)
  const [saveId, setSaveId] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [copyDone, setCopyDone] = useState(false);

  const dragInfo = useRef({
    isDragging: false,
    action: 0,
    startIndex: -1,
    axis: null as "row" | "col" | null,
    initialGrid: [] as number[],
  });

  const stateRef = useRef({ userGrid: [] as number[] });
  useEffect(() => {
    stateRef.current = { userGrid };
  }, [userGrid]);

  const gridRef = useRef<HTMLDivElement>(null);
  const playAreaRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // 관리자 권한만 확인 (퍼즐 목록은 안 불러옴)
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("로그인이 필요합니다.");
        return router.push("/");
      }

      const { data: userData } = await supabase.from("user_ids").select("nickname, custom_id").eq("email", user.email).maybeSingle();
      const nickname = userData?.nickname || user.user_metadata?.nickname || "익명";
      const isAdmin = nickname === "주인장" || userData?.custom_id === "admin";

      if (!isAdmin) {
        alert("관리자만 접근할 수 있습니다.");
        return router.push("/");
      }
      setIsLoading(false);
    };
    init();
  }, [router]);

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
    const gridEl = gridRef.current;
    if (!gridEl || !isGridLoaded) return;

    let twoFingerMid: { x: number; y: number } | null = null;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        if (dragInfo.current.isDragging) {
          setUserGrid([...dragInfo.current.initialGrid]);
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
      if (!dragInfo.current.isDragging) return;
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
  }, [isGridLoaded]);

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

  // JSON 붙여넣고 "불러오기"
  const loadFromJson = () => {
    const w = parseInt(String(inputWidth), 10);
    const h = parseInt(String(inputHeight), 10);
    if (isNaN(w) || isNaN(h) || w < 1 || h < 1) {
      alert("가로/세로 크기를 올바르게 입력해주세요.");
      return;
    }

    let parsed: any;
    try {
      parsed = JSON.parse(jsonInput);
    } catch (e) {
      alert("JSON 형식이 올바르지 않습니다. 다시 확인해주세요.");
      return;
    }

    if (!Array.isArray(parsed)) {
      alert("배열([...]) 형태의 JSON이어야 합니다.");
      return;
    }

    if (parsed.length !== w * h) {
      alert(`배열 길이(${parsed.length})가 가로×세로(${w}×${h}=${w * h})와 맞지 않습니다.`);
      return;
    }

    const normalized = parsed.map((v) => (v === 1 ? 1 : 0));
    setCurrentWidth(w);
    setCurrentHeight(h);
    setUserGrid(normalized);
    setZoomFactor(1.0);
    setIsGridLoaded(true);
    setCopyDone(false);
  };

  const backToInput = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    setIsGridLoaded(false);
  };

  const applyLineDrag = (currentIndex: number, clientX: number, clientY: number) => {
    const { startIndex, action, initialGrid } = dragInfo.current;
    if (startIndex === -1) return;

    const startR = Math.floor(startIndex / currentWidth);
    const startC = startIndex % currentWidth;
    const currR = Math.floor(currentIndex / currentWidth);
    const currC = currentIndex % currentWidth;

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

    if (tooltipRef.current) {
      tooltipRef.current.style.left = clientX + "px";
      tooltipRef.current.style.top = clientY + "px";
      tooltipRef.current.style.display = "block";

      const currentDragCount = axis === "row" ? Math.abs(currR - startR) + 1 : axis === "col" ? Math.abs(currC - startC) + 1 : Math.max(Math.abs(currR - startR), Math.abs(currC - startC)) + 1;

      let totalConnectedCount = 0;
      if (axis === "row" || !axis) {
        let tr = startR;
        while (tr >= 0 && newGrid[tr * currentWidth + startC] === action) { totalConnectedCount++; tr--; }
        tr = startR + 1;
        while (tr < currentHeight && newGrid[tr * currentWidth + startC] === action) { totalConnectedCount++; tr++; }
      } else if (axis === "col") {
        let tc = startC;
        while (tc >= 0 && newGrid[startR * currentWidth + tc] === action) { totalConnectedCount++; tc--; }
        tc = startC + 1;
        while (tc < currentWidth && newGrid[startR * currentWidth + tc] === action) { totalConnectedCount++; tc++; }
      }

      if (currentDragCount === totalConnectedCount || totalConnectedCount === 0) {
        tooltipRef.current.innerText = `${currentDragCount}`;
      } else {
        tooltipRef.current.innerText = `${currentDragCount}/${totalConnectedCount}`;
      }
    }
  };

  const handlePointerDown = (index: number, e: any) => {
    if (e.pointerType === "touch") return;
    e.preventDefault();
    const currentGrid = stateRef.current.userGrid;
    const isFilled = currentGrid[index] === 1;
    const action = isFilled ? 0 : 1;

    dragInfo.current = { isDragging: true, action, startIndex: index, axis: null, initialGrid: [...currentGrid] };

    const newGrid = [...currentGrid];
    newGrid[index] = action;
    setUserGrid(newGrid);
  };

  const handlePointerEnter = (index: number, e: any) => {
    if (!dragInfo.current.isDragging) return;
    applyLineDrag(index, e.clientX, e.clientY);
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

  const outputJson = JSON.stringify(userGrid);

  const copyOutput = async () => {
    try {
      await navigator.clipboard.writeText(outputJson);
      setCopyDone(true);
      setTimeout(() => setCopyDone(false), 2000);
    } catch (e) {
      alert("복사에 실패했습니다. 아래 텍스트를 직접 선택해서 복사해주세요.");
    }
  };

  // 선택사항: 퍼즐 ID 입력해서 DB에 바로 저장
  const saveToDb = async () => {
    if (!saveId.trim()) return alert("저장할 퍼즐 ID를 입력해주세요.");
    if (!userGrid.includes(1)) return alert("빈 그림은 저장할 수 없습니다!");
    setIsSaving(true);

    const { error } = await supabase.from("puzzles").update({ data: userGrid }).eq("id", saveId.trim());

    setIsSaving(false);

    if (error) {
      alert("저장 실패: " + error.message);
    } else {
      alert(`퍼즐 ID ${saveId}에 성공적으로 저장되었습니다!`);
    }
  };

  const cellSize = Math.max(10, 30 * zoomFactor);

  if (isLoading) return <div style={{ padding: "50px", textAlign: "center" }}>불러오는 중...</div>;

  // ===================== 편집 화면 =====================
  if (isGridLoaded) {
    return (
      <div className="view active" style={{ display: "block", position: "relative" }}>
        <div id="maker-area" ref={playAreaRef} style={{ background: "#f5f6f7", padding: "10px", borderRadius: "8px" }}>

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

          <div id="drag-count-tooltip" ref={tooltipRef} className="drag-tooltip" style={{ position: "fixed", display: "none", background: "#2196F3", color: "white", border: "2px solid white", borderRadius: "50%", width: "32px", height: "32px", textAlign: "center", lineHeight: "28px", fontWeight: "bold", fontSize: "14px", pointerEvents: "none", zIndex: 9999, transform: "translate(15px, -35px)" }}>1</div>

          <div className="section-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", margin: "0 0 15px 0", borderBottom: "1px solid #eee", paddingBottom: "10px" }}>
            <h2 style={{ margin: 0, fontSize: "18px", color: "#111" }}>🔧 격자 편집 (<span>{currentWidth} x {currentHeight}</span>)</h2>
            <button style={{ background: "none", border: "none", color: "#f44336", fontWeight: "bold", cursor: "pointer" }} onClick={backToInput}>← JSON 다시 입력</button>
          </div>

          <div style={{ display: "flex", gap: "8px", alignItems: "center", justifyContent: "center", marginBottom: "15px", background: "#fff", padding: "10px 15px", borderRadius: "6px", border: "1px solid #ddd" }}>
            <span style={{ fontSize: "14px", fontWeight: "bold" }}>🔎 줌: </span>
            <button onClick={() => setZoomFactor(z => Math.min(3.0, z + 0.2))} style={{ padding: "4px 10px", fontSize: "13px", border: "1px solid #bbb", background: "#fff", borderRadius: "4px", cursor: "pointer" }}>+</button>
            <button onClick={() => setZoomFactor(z => Math.max(0.2, z - 0.2))} style={{ padding: "4px 10px", fontSize: "13px", border: "1px solid #bbb", background: "#fff", borderRadius: "4px", cursor: "pointer" }}>-</button>
            <button onClick={() => setZoomFactor(1.0)} style={{ padding: "4px 10px", fontSize: "13px", border: "1px solid #bbb", background: "#fff", borderRadius: "4px", cursor: "pointer" }}>기본</button>
            <button onClick={toggleFullScreen} style={{ marginLeft: "10px", padding: "4px 10px", fontWeight: "bold", backgroundColor: isFullscreen ? "#f44336" : "#2196F3", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
              {isFullscreen ? "↙ 화면 축소" : "⛶ 전체화면"}
            </button>
          </div>

          <div ref={gridRef} className="scroll-wrapper" style={{ overflow: "auto", maxWidth: "100%", maxHeight: "65vh", padding: "10px", marginBottom: "10px", border: "1px solid #ddd", background: "#fdfdfd" }} onContextMenu={(e) => e.preventDefault()}>
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
                    style={{
                      touchAction: "none",
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

          {/* 결과 JSON 출력 */}
          <div style={{ marginTop: "20px", background: "#fff", padding: "15px", borderRadius: "6px", border: "1px solid #ddd" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <label style={{ fontSize: "14px", fontWeight: "bold" }}>📋 수정된 격자 JSON</label>
              <button onClick={copyOutput} style={{ padding: "6px 14px", fontSize: "13px", cursor: "pointer", backgroundColor: copyDone ? "#4CAF50" : "#2196F3", color: "white", border: "none", borderRadius: "4px", fontWeight: "bold" }}>
                {copyDone ? "✓ 복사됨!" : "복사하기"}
              </button>
            </div>
            <textarea
              readOnly
              value={outputJson}
              onFocus={(e) => e.target.select()}
              style={{ width: "100%", height: "100px", fontFamily: "monospace", fontSize: "12px", padding: "10px", border: "1px solid #ddd", borderRadius: "4px", boxSizing: "border-box", resize: "vertical" }}
            />
          </div>

          {/* 선택사항: DB에 바로 저장 */}
          <div style={{ marginTop: "15px", background: "#fff8e1", padding: "15px", borderRadius: "6px", border: "1px solid #ffe082" }}>
            <label style={{ fontSize: "13px", fontWeight: "bold", display: "block", marginBottom: "8px" }}>(선택) 이 퍼즐의 DB ID를 알고 있다면 바로 저장</label>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type="text"
                placeholder="퍼즐 ID"
                value={saveId}
                onChange={(e) => setSaveId(e.target.value)}
                style={{ flex: 1, padding: "8px 10px", border: "1px solid #ddd", borderRadius: "4px", fontSize: "13px" }}
              />
              <button onClick={saveToDb} disabled={isSaving} style={{ padding: "8px 16px", fontSize: "13px", cursor: "pointer", backgroundColor: "#4CAF50", color: "white", border: "none", borderRadius: "4px", fontWeight: "bold" }}>
                {isSaving ? "저장 중..." : "DB에 저장"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ===================== JSON 입력 화면 =====================
  return (
    <div className="view active">
      <div className="header-title-bar" style={{ borderBottom: "2px solid #111", paddingBottom: "15px", marginBottom: "20px" }}>
        <h2 style={{ fontSize: "24px", fontWeight: "bold", margin: 0 }}>🔧 퍼즐 격자 편집기 (관리자)</h2>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        <div style={{ display: "flex", gap: "10px" }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: "13px", fontWeight: "bold", display: "block", marginBottom: "5px" }}>가로 (width)</label>
            <input type="number" min="1" value={inputWidth} onChange={(e) => setInputWidth(Number(e.target.value))} style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "4px", boxSizing: "border-box" }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: "13px", fontWeight: "bold", display: "block", marginBottom: "5px" }}>세로 (height)</label>
            <input type="number" min="1" value={inputHeight} onChange={(e) => setInputHeight(Number(e.target.value))} style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "4px", boxSizing: "border-box" }} />
          </div>
        </div>

        <div>
          <label style={{ fontSize: "13px", fontWeight: "bold", display: "block", marginBottom: "5px" }}>격자 JSON 붙여넣기 (예: [0,1,1,0,...])</label>
          <textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder="[0,0,0,1,1,0,...]"
            style={{ width: "100%", height: "200px", fontFamily: "monospace", fontSize: "13px", padding: "10px", border: "1px solid #ddd", borderRadius: "4px", boxSizing: "border-box", resize: "vertical" }}
          />
        </div>

        <button onClick={loadFromJson} style={{ padding: "12px 20px", fontSize: "15px", cursor: "pointer", backgroundColor: "#2196F3", color: "white", border: "none", borderRadius: "4px", fontWeight: "bold" }}>
          격자로 불러오기
        </button>
      </div>
    </div>
  );
}