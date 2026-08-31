import { solveLine, CellState } from "./lineSolver";

export type HintResult =
  | { type: "mistake"; cells: number[] }
  | { type: "next"; index: number; value: 1 | 2 }
  | { type: "none" };

interface PuzzleLike {
  width: number;
  height: number;
  data: number[]; // 정답 배열 (1/0), 행 우선
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

/**
 * 1단계: userGrid에 실수(정답과 모순되는 칸)가 있는지 검사.
 * 2단계: 실수가 없으면 라인 솔빙으로 확정 가능한 다음 칸 하나를 찾는다.
 */
export function getHint(puzzle: PuzzleLike, userGrid: CellState[]): HintResult {
  const { width: w, height: h, data: solution } = puzzle;

  const mistakes: number[] = [];
  for (let i = 0; i < w * h; i++) {
    const u = userGrid[i];
    const correct = solution[i] === 1;
    if (u === 1 && !correct) mistakes.push(i);
    else if (u === 2 && correct) mistakes.push(i);
  }
  if (mistakes.length > 0) return { type: "mistake", cells: mistakes };

  for (let r = 0; r < h; r++) {
    const rowLine = solution.slice(r * w, r * w + w);
    const rowHint = computeHints(rowLine);
    const rowCells: CellState[] = [];
    for (let c = 0; c < w; c++) rowCells.push(userGrid[r * w + c] ?? 0);
    const solved = solveLine(rowHint, rowCells);
    for (let c = 0; c < w; c++) {
      if (rowCells[c] === 0 && solved[c] !== 0) {
        return { type: "next", index: r * w + c, value: solved[c] as 1 | 2 };
      }
    }
  }

  for (let c = 0; c < w; c++) {
    const colLine: number[] = [];
    for (let r = 0; r < h; r++) colLine.push(solution[r * w + c]);
    const colHint = computeHints(colLine);
    const colCells: CellState[] = [];
    for (let r = 0; r < h; r++) colCells.push(userGrid[r * w + c] ?? 0);
    const solved = solveLine(colHint, colCells);
    for (let r = 0; r < h; r++) {
      if (colCells[r] === 0 && solved[r] !== 0) {
        return { type: "next", index: r * w + c, value: solved[r] as 1 | 2 };
      }
    }
  }

  return { type: "none" };
}
