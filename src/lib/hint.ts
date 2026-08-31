import { solveLine, CellState } from "./lineSolver";

export type HintResult =
  | { type: "mistake"; cells: number[] }
  | { type: "next"; index: number; value: 1 | 2 }
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

  // 1단계: 실수 검사 (칠했는데 정답이 아니거나, X 했는데 정답인 칸)
  const mistakes: number[] = [];
  for (let i = 0; i < w * h; i++) {
    const u = userGrid[i];
    const correct = solution[i] === 1;
    if (u === 1 && !correct) mistakes.push(i);
    else if (u === 2 && correct) mistakes.push(i);
  }
  if (mistakes.length > 0) return { type: "mistake", cells: mistakes };

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

  // 행부터 라인 솔빙 시도
  for (let r = 0; r < h; r++) {
    const rowCells: CellState[] = [];
    for (let c = 0; c < w; c++) rowCells.push((userGrid[r * w + c] as CellState) ?? 0);
    const solved = solveLine(rowHints[r], rowCells);
    for (let c = 0; c < w; c++) {
      if (rowCells[c] === 0 && solved[c] !== 0) {
        return { type: "next", index: r * w + c, value: solved[c] as 1 | 2 };
      }
    }
  }

  // 열도 라인 솔빙 시도
  for (let c = 0; c < w; c++) {
    const colCells: CellState[] = [];
    for (let r = 0; r < h; r++) colCells.push((userGrid[r * w + c] as CellState) ?? 0);
    const solved = solveLine(colHints[c], colCells);
    for (let r = 0; r < h; r++) {
      if (colCells[r] === 0 && solved[r] !== 0) {
        return { type: "next", index: r * w + c, value: solved[r] as 1 | 2 };
      }
    }
  }

  return { type: "none" };
}
