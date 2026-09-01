import { solveLine, CellState } from "./lineSolver";

export type HintResult =
  | { type: "fixMistake"; index: number; value: 1 | 2 }
  | { type: "reveal"; cells: { index: number; value: 1 | 2 }[] }
  | { type: "none" };

interface PuzzleLike {
  width: number;
  height: number;
  data: number[]; // 정답 배열 (행 우선, 1/0)
}

function computeHints(line: number[]): number[] {
  const hints: number[] = [];
  let count = 0;
  for (const v of line) {
    if (v === 1) count++;
    else if (count > 0) {
      hints.push(count);
      count = 0;
    }
  }
  if (count > 0) hints.push(count);
  if (hints.length === 0) hints.push(0);
  return hints;
}

export function getHint(puzzle: PuzzleLike, userGrid: number[]): HintResult {
  const { width: w, height: h, data: solution } = puzzle;

  // 1단계: 실수를 하나 찾아서 고쳐줌 (여러 개 있어도 하나씩만)
  for (let i = 0; i < w * h; i++) {
    const u = userGrid[i];
    const correct = solution[i] === 1;
    if ((u === 1 && !correct) || (u === 2 && correct)) {
      return { type: "fixMistake", index: i, value: correct ? 1 : 2 };
    }
  }

  // 2단계: 행/열 힌트 계산 (정답 기준)
  const rowHints: number[][] = [];
  for (let r = 0; r < h; r++) {
    rowHints.push(computeHints(solution.slice(r * w, r * w + w)));
  }
  const colHints: number[][] = [];
  for (let c = 0; c < w; c++) {
    const col: number[] = [];
    for (let r = 0; r < h; r++) col.push(solution[r * w + c]);
    colHints.push(computeHints(col));
  }

  // 새로 확정된 칸들 중, "칠할 칸(1)"으로 이루어진 첫 번째 덩어리만 뽑아냄.
  // X만 있는 덩어리는 건너뛴다 - X는 실수 교정 때만 보여주기로 했으므로.
  function firstFilledChunk(
    changed: { pos: number; value: 1 | 2 }[]
  ): { pos: number; value: 1 | 2 }[] {
    for (let i = 0; i < changed.length; i++) {
      if (changed[i].value !== 1) continue;
      const chunk = [changed[i]];
      for (let j = i + 1; j < changed.length; j++) {
        const prev = changed[j - 1];
        const cur = changed[j];
        if (cur.pos === prev.pos + 1 && cur.value === 1) {
          chunk.push(cur);
        } else {
          break;
        }
      }
      return chunk;
    }
    return []; // 이 줄엔 칠할 칸이 하나도 없음 (X만 확정됨) - 다음 줄로 넘어감
  }

  // 행을 하나씩 훑다가, 칠할 칸(1)이 새로 확정되는 줄을 찾으면 그 덩어리만 반환.
  // 그 줄에 X만 확정됐다면(칠할 칸 없음) 그냥 다음 줄로 넘어감.
  for (let r = 0; r < h; r++) {
    const rowCells: CellState[] = [];
    for (let c = 0; c < w; c++) rowCells.push((userGrid[r * w + c] as CellState) ?? 0);
    const solved = solveLine(rowHints[r], rowCells);
    const changed: { pos: number; value: 1 | 2 }[] = [];
    for (let c = 0; c < w; c++) {
      if (rowCells[c] === 0 && solved[c] !== 0) changed.push({ pos: c, value: solved[c] as 1 | 2 });
    }
    const chunk = firstFilledChunk(changed);
    if (chunk.length > 0) {
      return { type: "reveal", cells: chunk.map((c) => ({ index: r * w + c.pos, value: c.value })) };
    }
  }

  // 열도 마찬가지
  for (let c = 0; c < w; c++) {
    const colCells: CellState[] = [];
    for (let r = 0; r < h; r++) colCells.push((userGrid[r * w + c] as CellState) ?? 0);
    const solved = solveLine(colHints[c], colCells);
    const changed: { pos: number; value: 1 | 2 }[] = [];
    for (let r = 0; r < h; r++) {
      if (colCells[r] === 0 && solved[r] !== 0) changed.push({ pos: r, value: solved[r] as 1 | 2 });
    }
    const chunk = firstFilledChunk(changed);
    if (chunk.length > 0) {
      return { type: "reveal", cells: chunk.map((ch) => ({ index: ch.pos * w + c, value: ch.value })) };
    }
  }

  return { type: "none" };
}