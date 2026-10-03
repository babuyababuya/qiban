(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.GoEngine = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const BLACK = 1;
  const WHITE = 2;
  const EMPTY = 0;

  function create(size) {
    return Array.from({ length: size }, () => Array(size).fill(EMPTY));
  }

  function cloneBoard(board) {
    return board.map((row) => row.slice());
  }

  function neighbors(x, y, size) {
    const out = [];
    if (x > 0) out.push([x - 1, y]);
    if (x + 1 < size) out.push([x + 1, y]);
    if (y > 0) out.push([x, y - 1]);
    if (y + 1 < size) out.push([x, y + 1]);
    return out;
  }

  function groupAt(board, x, y) {
    const color = board[y][x];
    if (!color) return { group: [], libertyKeys: new Set(), liberties: 0 };
    const size = board.length;
    const stack = [[x, y]];
    const seen = new Set([x + "," + y]);
    const group = [];
    const libertyKeys = new Set();
    while (stack.length) {
      const [cx, cy] = stack.pop();
      group.push([cx, cy]);
      for (const [nx, ny] of neighbors(cx, cy, size)) {
        const value = board[ny][nx];
        const key = nx + "," + ny;
        if (value === EMPTY) libertyKeys.add(key);
        else if (value === color && !seen.has(key)) {
          seen.add(key);
          stack.push([nx, ny]);
        }
      }
    }
    return { group, libertyKeys, liberties: libertyKeys.size };
  }

  function isEye(board, x, y, color) {
    if (board[y][x] !== EMPTY) return false;
    const around = neighbors(x, y, board.length);
    if (around.length < 2) return false;
    return around.every(([nx, ny]) => board[ny][nx] === color);
  }

  function place(board, x, y, color, ko) {
    const size = board.length;
    if (x < 0 || y < 0 || x >= size || y >= size) return { ok: false, reason: "off" };
    if (board[y][x] !== EMPTY) return { ok: false, reason: "occupied" };
    if (ko && ko.x === x && ko.y === y) return { ok: false, reason: "ko" };

    const next = cloneBoard(board);
    next[y][x] = color;
    const opponent = color === BLACK ? WHITE : BLACK;
    const captured = [];
    const seen = new Set();
    for (const [nx, ny] of neighbors(x, y, size)) {
      if (next[ny][nx] !== opponent) continue;
      const id = nx + "," + ny;
      if (seen.has(id)) continue;
      const group = groupAt(next, nx, ny);
      for (const [gx, gy] of group.group) seen.add(gx + "," + gy);
      if (group.liberties === 0) {
        for (const [gx, gy] of group.group) {
          next[gy][gx] = EMPTY;
          captured.push([gx, gy]);
        }
      }
    }

    const self = groupAt(next, x, y);
    if (self.liberties === 0) return { ok: false, reason: "suicide" };

    let nextKo = null;
    if (captured.length === 1 && self.liberties === 1 && self.libertyKeys.has(captured[0][0] + "," + captured[0][1])) {
      nextKo = { x: captured[0][0], y: captured[0][1] };
    }
    return {
      ok: true,
      board: next,
      captured,
      ko: nextKo,
      liberties: self.liberties,
    };
  }

  function playAt(board, x, y, color, ko) {
    const result = place(board, x, y, color, ko);
    if (result.ok || result.reason !== "suicide") return result;
    const opponent = color === BLACK ? WHITE : BLACK;
    if (isEye(board, x, y, opponent)) return { ok: false, reason: "eye" };
    if (isEye(board, x, y, color)) return { ok: false, reason: "ownEye" };
    return result;
  }

  function legalMoves(board, color, ko) {
    const size = board.length;
    const moves = [];
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const result = place(board, x, y, color, ko);
        if (result.ok) {
          moves.push({
            x,
            y,
            captured: result.captured.length,
            ko: result.ko,
            liberties: result.liberties,
            board: result.board,
          });
        }
      }
    }
    return moves;
  }

  function advise(board, color, ko) {
    const moves = legalMoves(board, color, ko);
    let bestCapture = 0;
    for (const move of moves) bestCapture = Math.max(bestCapture, move.captured);
    const seen = new Set();
    let atari = false;
    for (let y = 0; y < board.length; y += 1) {
      for (let x = 0; x < board.length; x += 1) {
        if (board[y][x] !== color) continue;
        const id = x + "," + y;
        if (seen.has(id)) continue;
        const group = groupAt(board, x, y);
        for (const [gx, gy] of group.group) seen.add(gx + "," + gy);
        if (group.liberties === 1) atari = true;
      }
    }
    let kind = "calm";
    if (atari) kind = "atari";
    else if (bestCapture > 0) kind = "capture";
    return { kind, bestCapture, moveCount: moves.length };
  }

  function botMove(board, color, ko) {
    const moves = legalMoves(board, color, ko);
    if (!moves.length) return null;
    const size = board.length;
    const center = (size - 1) / 2;
    let best = null;
    let bestScore = -1e9;
    for (const move of moves) {
      let score = move.captured * 140 + move.liberties * 3;
      if (move.liberties === 1 && move.captured === 0) score -= 55;
      if (isEye(board, move.x, move.y, color)) score -= 100;
      for (const [nx, ny] of neighbors(move.x, move.y, size)) {
        const value = board[ny][nx];
        if (value && value !== color) score += 9;
        if (value === color) {
          score += 2;
          const group = groupAt(board, nx, ny);
          if (group.liberties === 1 && group.libertyKeys.has(move.x + "," + move.y)) score += 70;
        }
      }
      score -= (Math.abs(move.x - center) + Math.abs(move.y - center)) * 0.45;
      if (score > bestScore) {
        bestScore = score;
        best = move;
      }
    }
    return best ? { x: best.x, y: best.y } : null;
  }

  return {
    BLACK,
    WHITE,
    EMPTY,
    create,
    cloneBoard,
    neighbors,
    groupAt,
    isEye,
    place,
    playAt,
    legalMoves,
    advise,
    botMove,
  };
});
