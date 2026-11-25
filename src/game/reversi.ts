export type Cell = 0 | 1 | 2; // 0 = vide, 1 = noir, 2 = blanc
export type Board = Cell[][];

export const BOARD_SIZE = 8;
export const EMPTY: Cell = 0;
export const BLACK: Cell = 1;
export const WHITE: Cell = 2;

export const opponent = (p: Cell) => (p === BLACK ? WHITE : BLACK);

export function createInitialBoard(): Board {
  const b: Board = Array.from({ length: BOARD_SIZE }, () =>
    Array(BOARD_SIZE).fill(EMPTY) as Cell[]
  );
  const mid = BOARD_SIZE / 2;
  b[mid - 1][mid - 1] = WHITE;
  b[mid][mid] = WHITE;
  b[mid - 1][mid] = BLACK;
  b[mid][mid - 1] = BLACK;
  return b;
}

const DIRS: [number, number][] = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],           [0, 1],
  [1, -1],  [1, 0],  [1, 1],
];

export function inBounds(r: number, c: number) {
  return r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE;
}

// Renvoie les cases qui seraient retournées si `player` joue en (r,c), sinon [].
export function getFlips(board: Board, r: number, c: number, player: Cell): [number, number][] {
  if (!inBounds(r, c) || board[r][c] !== EMPTY) return [];
  const opp = opponent(player);
  const flips: [number, number][] = [];
  for (const [dr, dc] of DIRS) {
    const line: [number, number][] = [];
    let nr = r + dr;
    let nc = c + dc;
    while (inBounds(nr, nc) && board[nr][nc] === opp) {
      line.push([nr, nc]);
      nr += dr;
      nc += dc;
    }
    if (line.length > 0 && inBounds(nr, nc) && board[nr][nc] === player) {
      for (const [fr, fc] of line) flips.push([fr, fc]);
    }
  }
  return flips;
}

export function getValidMoves(board: Board, player: Cell): [number, number][] {
  const moves: [number, number][] = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (getFlips(board, r, c, player).length > 0) moves.push([r, c]);
    }
  }
  return moves;
}

export function applyMove(
  board: Board,
  r: number,
  c: number,
  player: Cell
): { next: Board; flips: [number, number][] } {
  const flips = getFlips(board, r, c, player);
  if (flips.length === 0) return { next: board, flips: [] };
  const next = board.map((row) => row.slice());
  next[r][c] = player;
  for (const [fr, fc] of flips) next[fr][fc] = player;
  return { next, flips };
}

export function countDiscs(board: Board): { black: number; white: number } {
  let black = 0;
  let white = 0;
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === BLACK) black++;
      else if (board[r][c] === WHITE) white++;
    }
  }
  return { black, white };
}

export function cloneBoard(board: Board): Board {
  return board.map((row) => row.slice());
}

// Table de pondération positionnelle (les coins valent beaucoup, les cases X/C peu).
const WEIGHTS: number[][] = [
  [120, -20, 20, 5, 5, 20, -20, 120],
  [-20, -40, -5, -5, -5, -5, -40, -20],
  [20, -5, 15, 3, 3, 15, -5, 20],
  [5, -5, 3, 3, 3, 3, -5, 5],
  [5, -5, 3, 3, 3, 3, -5, 5],
  [20, -5, 15, 3, 3, 15, -5, 20],
  [-20, -40, -5, -5, -5, -5, -40, -20],
  [120, -20, 20, 5, 5, 20, -20, 120],
];

function evaluate(board: Board, player: Cell): number {
  const opp = opponent(player);
  let positional = 0;
  let myDiscs = 0;
  let oppDiscs = 0;
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const cell = board[r][c];
      if (cell === player) {
        positional += WEIGHTS[r][c];
        myDiscs++;
      } else if (cell === opp) {
        positional -= WEIGHTS[r][c];
        oppDiscs++;
      }
    }
  }

  // Mobilité : nombre de coups disponibles.
  const myMoves = getValidMoves(board, player).length;
  const oppMoves = getValidMoves(board, opp).length;
  let mobility = 0;
  if (myMoves + oppMoves !== 0) {
    mobility = (100 * (myMoves - oppMoves)) / (myMoves + oppMoves);
  }

  // Parité de pièces (importante surtout en fin de partie).
  let parity = 0;
  if (myDiscs + oppDiscs !== 0) {
    parity = (100 * (myDiscs - oppDiscs)) / (myDiscs + oppDiscs);
  }

  const empties = 64 - myDiscs - oppDiscs;
  // En fin de partie on privilégie le nombre de pièces.
  const parityWeight = empties < 12 ? 4 : 1;

  return positional + 8 * mobility + parityWeight * parity;
}

function minimax(
  board: Board,
  player: Cell,
  toMove: Cell,
  depth: number,
  alpha: number,
  beta: number
): number {
  if (depth === 0) return evaluate(board, player);

  const moves = getValidMoves(board, toMove);
  if (moves.length === 0) {
    // Si l'adversaire ne peut pas jouer non plus -> fin de partie.
    const oppMoves = getValidMoves(board, opponent(toMove));
    if (oppMoves.length === 0) {
      const { black, white } = countDiscs(board);
      const myCount = player === BLACK ? black : white;
      const oppCount = player === BLACK ? white : black;
      return (myCount - oppCount) * 1000;
    }
    // On passe le tour.
    return minimax(board, player, opponent(toMove), depth, alpha, beta);
  }

  const maximizing = toMove === player;
  if (maximizing) {
    let value = -Infinity;
    for (const [r, c] of moves) {
      const { next } = applyMove(board, r, c, toMove);
      value = Math.max(value, minimax(next, player, opponent(toMove), depth - 1, alpha, beta));
      alpha = Math.max(alpha, value);
      if (alpha >= beta) break;
    }
    return value;
  } else {
    let value = Infinity;
    for (const [r, c] of moves) {
      const { next } = applyMove(board, r, c, toMove);
      value = Math.min(value, minimax(next, player, opponent(toMove), depth - 1, alpha, beta));
      beta = Math.min(beta, value);
      if (alpha >= beta) break;
    }
    return value;
  }
}

// Profondeur de recherche par niveau (1 à 6).
export function depthForLevel(level: number): number {
  // niveau 1 -> glouton ; niveau 6 -> recherche profonde
  switch (level) {
    case 1:
      return 0; // glouton (aléatoire/positionnel léger)
    case 2:
      return 1;
    case 3:
      return 2;
    case 4:
      return 4;
    case 5:
      return 5;
    case 6:
      return 6;
    default:
      return 2;
  }
}

const cornerScore = (r: number, c: number) => {
  const isCorner =
    (r === 0 && c === 0) ||
    (r === 0 && c === BOARD_SIZE - 1) ||
    (r === BOARD_SIZE - 1 && c === 0) ||
    (r === BOARD_SIZE - 1 && c === BOARD_SIZE - 1);
  if (isCorner) return 1000;
  const isEdge = r === 0 || r === BOARD_SIZE - 1 || c === 0 || c === BOARD_SIZE - 1;
  if (isEdge) return 50;
  return 0;
};

// Choisit le coup de l'IA en fonction du niveau de difficulté.
export function pickAIMove(board: Board, player: Cell, level: number): [number, number] | null {
  const moves = getValidMoves(board, player);
  if (moves.length === 0) return null;
  if (moves.length === 1) return moves[0];

  const depth = depthForLevel(level);

  // Niveau 1 : IA "débutante", glouton positionnel avec une part d'aléatoire.
  if (depth === 0) {
    const scored = moves.map(([r, c]) => {
      const flips = getFlips(board, r, c, player).length;
      return { move: [r, c] as [number, number], score: flips * 10 + cornerScore(r, c) };
    });
    scored.sort((a, b) => b.score - a.score);
    // 40% de chance de jouer un coup sous-optimal (parmi les 3 meilleurs).
    if (Math.random() < 0.4 && scored.length > 1) {
      const pick = Math.floor(Math.random() * Math.min(3, scored.length));
      return scored[pick].move;
    }
    return scored[0].move;
  }

  // Niveaux 2+ : minimax avec élagage alpha-bêta.
  let best: [number, number] | null = null;
  let bestScore = -Infinity;
  // On ordonne les coups (coins d'abord) pour un meilleur élagage.
  const ordered = [...moves].sort(
    (a, b) => cornerScore(b[0], b[1]) - cornerScore(a[0], a[1])
  );
  for (const [r, c] of ordered) {
    const { next } = applyMove(board, r, c, player);
    const score = minimax(next, player, opponent(player), depth - 1, -Infinity, Infinity);
    if (score > bestScore) {
      bestScore = score;
      best = [r, c];
    }
  }
  return best;
}
