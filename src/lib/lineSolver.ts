// 노노그램 한 줄(행 또는 열) 논리 솔버
// 셀 상태 규약은 PlayPuzzleClient.tsx와 동일: 0=미확정, 1=칠함, 2=X(빈칸)
export type CellState = 0 | 1 | 2;

function normalizeClues(clues: number[]): number[] {
  // [0] 또는 [] 는 "이 줄에 칠할 칸이 없음"을 의미
  return clues.filter((c) => c > 0);
}

const NONE = -1;

/**
 * 한 줄(행/열)에 대해, 현재 상태(cells)와 모순되지 않는 모든 배치를 놓고 봤을 때
 * 모든 배치에서 공통으로 확정되는 칸만 채워서 반환한다.
 * 이미 확정된 칸(1 또는 2)은 그대로 유지한다.
 *
 * 알고리즘: forward/backward 도달 가능성 DP (O(n*k)).
 * - reach[i][j]  : 블록 0..i-1 이 정확히 배치되어 마지막 블록이 j에서 끝나는 상태가 가능한가
 * - reachB[i][j] : 블록 i..k-1 이 정확히 배치되어 첫 블록이 j에서 시작하는 상태가 가능한가
 *
 * 주의: "블록 i-1 이 j'(<=x) 에서 끝날 수 있다"는 사실만으로는 부족하다 - 그 j'과 다음
 * 블록의 시작 위치 사이의 간격(gap)에 이미 칠해진(1) 칸이 없는지도 반드시 같이 검증해야
 * 한다. 이때 검증할 j'은 항상 "x 이하에서 가장 큰 j'" 하나만 확인하면 충분하다 - 더 작은
 * j'을 쓰면 검증해야 할 간격이 넓어질 뿐이라 절대 더 유리해지지 않기 때문이다 (반대편도 대칭).
 */
export function solveLine(clues: number[], cells: CellState[]): CellState[] {
  const n = cells.length;
  const lens = normalizeClues(clues);
  const k = lens.length;

  const result: CellState[] = [...cells];

  if (k === 0) {
    for (let i = 0; i < n; i++) {
      if (result[i] === 0) result[i] = 2;
    }
    return result;
  }

  const minLen = lens.reduce((a, b) => a + b, 0) + (k - 1);
  if (minLen > n) return result; // 모순 상태 - 방어적으로 그대로 반환

  const prefixX = new Array(n + 1).fill(0);
  const prefix1 = new Array(n + 1).fill(0);
  for (let i = 0; i < n; i++) {
    prefixX[i + 1] = prefixX[i] + (cells[i] === 2 ? 1 : 0);
    prefix1[i + 1] = prefix1[i] + (cells[i] === 1 ? 1 : 0);
  }
  const hasX = (a: number, b: number) => b > a && prefixX[b] - prefixX[a] > 0;
  const has1 = (a: number, b: number) => b > a && prefix1[b] - prefix1[a] > 0;

  // ---- forward pass ----
  const reach: boolean[][] = new Array(k + 1);
  const prefixLast: number[][] = new Array(k + 1); // prefixLast[i][x] = x 이하에서 reach[i]가 true인 가장 큰 j (없으면 -1)

  reach[0] = new Array(n + 1).fill(false);
  for (let j = 0; j <= n; j++) reach[0][j] = !has1(0, j);
  prefixLast[0] = new Array(n + 1).fill(NONE);
  {
    let last = reach[0][0] ? 0 : NONE;
    prefixLast[0][0] = last;
    for (let x = 1; x <= n; x++) {
      if (reach[0][x]) last = x;
      prefixLast[0][x] = last;
    }
  }

  // canConnectForward(i, x, target): 블록 0..i-1 이 x 이하 어딘가(j)에서 끝날 수 있고,
  // 그 j 와 target 사이 구간에 칠해진 칸이 없는가
  const canConnectForward = (i: number, x: number, target: number): boolean => {
    if (x < 0) return false;
    const j = prefixLast[i][Math.min(x, n)];
    if (j === NONE) return false;
    return !has1(j, target);
  };

  for (let i = 1; i <= k; i++) {
    const len = lens[i - 1];
    reach[i] = new Array(n + 1).fill(false);
    for (let j = len; j <= n; j++) {
      const start = j - len;
      if (hasX(start, j)) continue;
      const gapBound = start - (i > 1 ? 1 : 0);
      if (canConnectForward(i - 1, gapBound, start)) reach[i][j] = true;
    }
    prefixLast[i] = new Array(n + 1).fill(NONE);
    let last = reach[i][0] ? 0 : NONE;
    prefixLast[i][0] = last;
    for (let x = 1; x <= n; x++) {
      if (reach[i][x]) last = x;
      prefixLast[i][x] = last;
    }
  }

  // 전체 실행가능성: 마지막 블록이 어디서 끝나든(j), 그 뒤(j..n)에 칠해진 칸만 없으면 됨
  if (!canConnectForward(k, n, n)) {
    return result; // 모순 - 방어적으로 그대로 반환
  }

  // ---- backward pass ----
  const reachB: boolean[][] = new Array(k + 1);
  const suffixFirst: number[][] = new Array(k + 1); // suffixFirst[i][x] = x 이상에서 reachB[i]가 true인 가장 작은 j (없으면 n+1)
  const SENTINEL = n + 1;

  reachB[k] = new Array(n + 1).fill(false);
  for (let j = 0; j <= n; j++) reachB[k][j] = !has1(j, n);
  suffixFirst[k] = new Array(n + 2).fill(SENTINEL);
  {
    let first = reachB[k][n] ? n : SENTINEL;
    suffixFirst[k][n] = first;
    for (let x = n - 1; x >= 0; x--) {
      if (reachB[k][x]) first = x;
      suffixFirst[k][x] = first;
    }
  }

  const canConnectBackward = (i: number, x: number, target: number): boolean => {
    if (x > n) return false;
    const j = suffixFirst[i][Math.max(x, 0)];
    if (j === SENTINEL) return false;
    return !has1(target, j);
  };

  for (let i = k - 1; i >= 0; i--) {
    const len = lens[i];
    reachB[i] = new Array(n + 1).fill(false);
    for (let start = 0; start + len <= n; start++) {
      const end = start + len;
      if (hasX(start, end)) continue;
      const gapBound = end + (i < k - 1 ? 1 : 0);
      if (canConnectBackward(i + 1, gapBound, end)) reachB[i][start] = true;
    }
    suffixFirst[i] = new Array(n + 2).fill(SENTINEL);
    let first = reachB[i][n] ? n : SENTINEL;
    suffixFirst[i][n] = first;
    for (let x = n - 1; x >= 0; x--) {
      if (reachB[i][x]) first = x;
      suffixFirst[i][x] = first;
    }
  }

  // ---- 칸별 가능/불가능 판정 ----
  const canBeFilled = new Array(n).fill(false);
  const diff = new Array(n + 1).fill(0);
  for (let i = 0; i < k; i++) {
    const len = lens[i];
    for (let s = 0; s + len <= n; s++) {
      if (hasX(s, s + len)) continue;
      const e = s + len;
      const gapBoundBefore = s - (i > 0 ? 1 : 0);
      const gapBoundAfter = e + (i < k - 1 ? 1 : 0);
      const okBefore = canConnectForward(i, gapBoundBefore, s);
      const okAfter = canConnectBackward(i + 1, gapBoundAfter, e);
      if (okBefore && okAfter) {
        diff[s]++;
        diff[e]--;
      }
    }
  }
  {
    let running = 0;
    for (let p = 0; p < n; p++) {
      running += diff[p];
      canBeFilled[p] = running > 0;
    }
  }

  const canBeEmpty = new Array(n).fill(false);
  for (let p = 0; p < n; p++) {
    for (let i = 0; i <= k; i++) {
      if (canConnectForward(i, p, p) && canConnectBackward(i, p + 1, p + 1)) {
        canBeEmpty[p] = true;
        break;
      }
    }
  }

  for (let p = 0; p < n; p++) {
    if (result[p] !== 0) continue;
    if (canBeFilled[p] && !canBeEmpty[p]) result[p] = 1;
    else if (!canBeFilled[p] && canBeEmpty[p]) result[p] = 2;
  }

  return result;
}

// ============================================================
// 퍼즐 검증: 라인 솔버로 끝까지 풀리는지, 유일해인지, 난이도 등을 계산
// ============================================================
export interface ValidateResult {
  solvable: boolean; // 라인 솔빙만으로 100% 풀리는가
  // 답이 유일한가. 라인 솔빙으로 풀렸으면 true(자동으로 유일). 안 풀렸으면 백트래킹으로 판정하되,
  // 크고 뒤죽박죽인 퍼즐은 시간이 너무 오래 걸릴 수 있어 예산 안에서 못 끝내면 null(판정 불가)을 반환.
  unique: boolean | null;
  difficulty: number | null; // 라인 솔빙으로 풀 때 필요한 훑기(스윕) 횟수. 라인 솔빙만으론 못 풀면 null
  ambiguity2x2: number; // 2x2 교환(체크무늬) 지점 개수
  fillRatio: number; // 채움 비율 (0~1)
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

function getRow(data: number[], width: number, r: number): number[] {
  return data.slice(r * width, r * width + width);
}
function getCol(data: number[], width: number, height: number, c: number): number[] {
  const out = new Array(height);
  for (let r = 0; r < height; r++) out[r] = data[r * width + c];
  return out;
}
export function lineSolveToFixpoint(
  rowHints: number[][],
  colHints: number[][],
  width: number,
  height: number,
  initial?: CellState[]
): { grid: CellState[]; sweeps: number; fullySolved: boolean } {
  const grid: CellState[] = initial ? [...initial] : new Array(width * height).fill(0);
  let sweeps = 0;
  let changed = true;

  while (changed) {
    changed = false;
    sweeps++;

    for (let r = 0; r < height; r++) {
      const rowCells: CellState[] = [];
      for (let c = 0; c < width; c++) rowCells.push(grid[r * width + c]);
      const solved = solveLine(rowHints[r], rowCells);
      for (let c = 0; c < width; c++) {
        if (solved[c] !== grid[r * width + c]) {
          grid[r * width + c] = solved[c];
          changed = true;
        }
      }
    }

    for (let c = 0; c < width; c++) {
      const colCells: CellState[] = [];
      for (let r = 0; r < height; r++) colCells.push(grid[r * width + c]);
      const solved = solveLine(colHints[c], colCells);
      for (let r = 0; r < height; r++) {
        if (solved[r] !== grid[r * width + c]) {
          grid[r * width + c] = solved[r];
          changed = true;
        }
      }
    }

    if (sweeps > width + height + 10) break; // 방어적 안전장치
  }

  const fullySolved = grid.every((v) => v !== 0);
  return { grid, sweeps, fullySolved };
}

const SOLUTION_SEARCH_ABORTED = -1;
// 유일해 판정 백트래킹에 허용하는 최대 시간(ms). 퍼즐 크기와 무관하게 실제 걸리는 시간을
// 직접 재는 방식이라야, 큰 격자에서 fixpoint 계산 1회 자체가 무거워도 안전하게 캡이 걸린다.
const SOLUTION_SEARCH_TIME_BUDGET_MS = 3000;

// deadline: 이 시각(ms, Date.now() 기준)을 넘기면 포기하고 -1을 반환한다 -
// 정교하게 설계되지 않은 크고 뒤죽박죽인 퍼즐이 브라우저를 무한정 멈춰세우는 걸 막기 위한 안전장치.
function countSolutions(
  rowHints: number[][],
  colHints: number[][],
  width: number,
  height: number,
  grid: CellState[],
  limit: number,
  deadline: number
): number {
  if (Date.now() > deadline) return SOLUTION_SEARCH_ABORTED;

  const { grid: solved, fullySolved } = lineSolveToFixpoint(rowHints, colHints, width, height, grid);

  if (fullySolved) return 1;

  const idx = solved.findIndex((v) => v === 0);
  if (idx === -1) return 1;

  let total = 0;
  for (const guess of [1, 2] as CellState[]) {
    const next = [...solved];
    next[idx] = guess;
    const sub = countSolutions(rowHints, colHints, width, height, next, limit - total, deadline);
    if (sub === SOLUTION_SEARCH_ABORTED) return SOLUTION_SEARCH_ABORTED;
    total += sub;
    if (total >= limit) return total;
  }
  return total;
}

export function validatePuzzle(data: number[], width: number, height: number): ValidateResult {
  const rowHints: number[][] = [];
  for (let r = 0; r < height; r++) rowHints.push(computeHints(getRow(data, width, r)));
  const colHints: number[][] = [];
  for (let c = 0; c < width; c++) colHints.push(computeHints(getCol(data, width, height, c)));

  const { sweeps, fullySolved } = lineSolveToFixpoint(rowHints, colHints, width, height);

  const solvable = fullySolved;
  const difficulty = fullySolved ? sweeps : null;

  let unique: boolean | null;
  if (fullySolved) {
    unique = true;
  } else {
    const solutionCount = countSolutions(
      rowHints,
      colHints,
      width,
      height,
      new Array(width * height).fill(0),
      2,
      Date.now() + SOLUTION_SEARCH_TIME_BUDGET_MS
    );
    unique = solutionCount === SOLUTION_SEARCH_ABORTED ? null : solutionCount <= 1;
  }

  let ambiguity2x2 = 0;
  for (let r = 0; r < height - 1; r++) {
    for (let c = 0; c < width - 1; c++) {
      const a = data[r * width + c];
      const b = data[r * width + c + 1];
      const cc = data[(r + 1) * width + c];
      const d = data[(r + 1) * width + c + 1];
      if ((a === 1 && d === 1 && b === 0 && cc === 0) || (a === 0 && d === 0 && b === 1 && cc === 1)) {
        ambiguity2x2++;
      }
    }
  }

  const fillRatio = data.reduce((sum, v) => sum + (v === 1 ? 1 : 0), 0) / (width * height);

  return { solvable, unique, difficulty, ambiguity2x2, fillRatio };
}