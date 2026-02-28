// ── Pure game-logic helpers (client-side) ─────────────────────────────────────

export const BINGO_LETTERS = ["B", "I", "N", "G", "O"];

/**
 * Returns which lines are complete given a set of marked numbers and a board.
 * @param {Set<number>} markedSet
 * @param {number[]} board  flat 25-element array
 * @returns {string[]}      e.g. ["row-0","col-2","diag-tl"]
 */
export function detectLines(markedSet, board) {
  const grid = board.map((n) => markedSet.has(n));
  const lines = [];

  for (let r = 0; r < 5; r++) {
    if ([0, 1, 2, 3, 4].every((c) => grid[r * 5 + c])) lines.push(`row-${r}`);
  }
  for (let c = 0; c < 5; c++) {
    if ([0, 1, 2, 3, 4].every((r) => grid[r * 5 + c])) lines.push(`col-${c}`);
  }
  if ([0, 6, 12, 18, 24].every((i) => grid[i])) lines.push("diag-tl");
  if ([4, 8, 12, 16, 20].every((i) => grid[i])) lines.push("diag-tr");

  return lines;
}

/**
 * Checks if a specific cell (index in flat board) is part of a completed line.
 */
export function isCellInLine(cellIndex, lines) {
  const row = Math.floor(cellIndex / 5);
  const col = cellIndex % 5;

  if (lines.includes(`row-${row}`)) return true;
  if (lines.includes(`col-${col}`)) return true;
  if (lines.includes("diag-tl") && row === col) return true;
  if (lines.includes("diag-tr") && row + col === 4) return true;
  return false;
}

/**
 * Maps bingoCount (0-5) → letter string for display.
 */
export function bingoProgress(count) {
  return BINGO_LETTERS.slice(0, count).join("");
}

/**
 * Returns true if this player has won (5 lines).
 */
export function isWinner(lines) {
  return lines.length >= 5;
}

/**
 * Shuffle utility (Fisher-Yates).
 */
export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function generateBoard() {
  return shuffle(Array.from({ length: 25 }, (_, i) => i + 1));
}
