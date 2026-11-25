import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  BLACK,
  WHITE,
  cloneBoard,
  countDiscs,
  createInitialBoard,
  getFlips,
  getValidMoves,
  pickAIMove,
  type Board,
  type Cell,
} from "./reversi";
import {
  isMusicEnabled,
  isSoundEnabled,
  playAIPlace,
  playFlip,
  playLose,
  playPlace,
  playWin,
  resumeAudio,
  setMusicEnabled as setMusicEnabledAudio,
  setSoundEnabled as setSoundEnabledAudio,
  startMusic,
} from "./audio";

// 6 niveaux de difficulté progressive.
export const LEVELS = [
  { level: 1, name: "Apprenti", desc: "Coups parfois maladroits", think: 350 },
  { level: 2, name: "Amateur", desc: "Joue correctement", think: 450 },
  { level: 3, name: "Confirmé", desc: "Anticipe 2 coups", think: 600 },
  { level: 4, name: "Expert", desc: "Anticipe 4 coups", think: 750 },
  { level: 5, name: "Maître", desc: "Stratégie avancée", think: 900 },
  { level: 6, name: "Grand Maître", desc: "Quasi imbattable", think: 1050 },
] as const;

type FlippingCell = { row: number; col: number; from: Cell; to: Cell; delay: number };

type GameContextValue = {
  board: Board;
  current: Cell;
  scores: { black: number; white: number };
  validMoves: [number, number][];
  humanColor: Cell;
  aiColor: Cell;
  level: number;
  flipping: FlippingCell[];
  lastMove: [number, number] | null;
  gameOver: boolean;
  winnerText: string;
  userWon: boolean;
  isAITurn: boolean;
  history: Board[];
  passNotice: boolean;
  soundOn: boolean;
  musicOn: boolean;
  setLevel: (l: number) => void;
  chooseHumanColor: (c: Cell) => void;
  play: (r: number, c: number) => void;
  reset: () => void;
  undo: () => void;
  toggleSound: () => void;
  toggleMusic: () => void;
};

const GameContext = createContext<GameContextValue | null>(null);

const FLIP_STAGGER_MS = 60;
const FLIP_DURATION_MS = 520;

export function GameProvider({ children }: { children: ReactNode }) {
  const [board, setBoard] = useState<Board>(() => createInitialBoard());
  const [current, setCurrent] = useState<Cell>(BLACK);
  const [flipping, setFlipping] = useState<FlippingCell[]>([]);
  const [lastMove, setLastMove] = useState<[number, number] | null>(null);
  const [humanColor, setHumanColorState] = useState<Cell>(BLACK);
  const [level, setLevelState] = useState<number>(3);
  const [history, setHistory] = useState<Board[]>([]);
  const [isAITurn, setIsAITurn] = useState(false);
  const [passNotice, setPassNotice] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [musicOn, setMusicOn] = useState(true);
  const aiTimeoutRef = useRef<number | null>(null);
  const winSoundPlayed = useRef(false);

  const aiColor: Cell = humanColor === BLACK ? WHITE : BLACK;

  const setLevel = useCallback((l: number) => setLevelState(l), []);

  const resetWith = useCallback((newHumanColor: Cell) => {
    if (aiTimeoutRef.current) {
      window.clearTimeout(aiTimeoutRef.current);
      aiTimeoutRef.current = null;
    }
    winSoundPlayed.current = false;
    setHumanColorState(newHumanColor);
    setBoard(createInitialBoard());
    setCurrent(BLACK);
    setFlipping([]);
    setLastMove(null);
    setHistory([]);
    setPassNotice(false);
    setIsAITurn(newHumanColor === WHITE);
  }, []);

  const reset = useCallback(() => resetWith(humanColor), [humanColor, resetWith]);
  const chooseHumanColor = useCallback((c: Cell) => resetWith(c), [resetWith]);

  const toggleSound = useCallback(() => {
    setSoundOn((v) => {
      const nv = !v;
      setSoundEnabledAudio(nv);
      return nv;
    });
  }, []);

  const toggleMusic = useCallback(() => {
    resumeAudio();
    setMusicOn((v) => {
      const nv = !v;
      setMusicEnabledAudio(nv);
      if (nv) startMusic();
      return nv;
    });
  }, []);

  const performMove = useCallback(
    (r: number, c: number, player: Cell) => {
      const flips = getFlips(board, r, c, player);
      if (flips.length === 0) return;

      setHistory((h) => [...h, board]);
      setLastMove([r, c]);

      // Effet sonore de pose.
      if (player === aiColor) playAIPlace();
      else playPlace();

      // Pose immédiate du nouveau pion.
      setBoard((prev) => {
        const copy = cloneBoard(prev);
        copy[r][c] = player;
        return copy;
      });

      const flipCells: FlippingCell[] = flips.map(([fr, fc], i) => ({
        row: fr,
        col: fc,
        from: board[fr][fc],
        to: player,
        delay: i * FLIP_STAGGER_MS,
      }));
      setFlipping(flipCells);

      // Sons de retournement en cascade.
      flipCells.forEach((_, i) => playFlip(i));

      // Au milieu de l'animation on bascule la couleur réelle.
      const mid = Math.max(120, FLIP_DURATION_MS / 2);
      window.setTimeout(() => {
        setBoard((prev) => {
          const copy = cloneBoard(prev);
          for (const f of flipCells) copy[f.row][f.col] = f.to;
          return copy;
        });
      }, mid);

      // Après toutes les animations, on passe au tour suivant.
      window.setTimeout(() => {
        setFlipping([]);
        const next = player === BLACK ? WHITE : BLACK;
        const nextValid = getValidMoves(board, next);
        if (nextValid.length === 0) {
          const other = player === BLACK ? WHITE : BLACK;
          const otherValid = getValidMoves(board, other);
          if (otherValid.length === 0) {
            setCurrent(next);
            return;
          }
          // Le joueur suivant passe son tour.
          setPassNotice(true);
          window.setTimeout(() => setPassNotice(false), 1600);
          setCurrent(other);
        } else {
          setCurrent(next);
        }
      }, FLIP_DURATION_MS + flipCells.length * FLIP_STAGGER_MS);
    },
    [board, aiColor]
  );

  const play = useCallback(
    (r: number, c: number) => {
      resumeAudio();
      if (musicOn) startMusic();
      if (isAITurn) return;
      if (flipping.length > 0) return;
      if (current !== humanColor) return;
      const valid = getValidMoves(board, current);
      if (!valid.some(([vr, vc]) => vr === r && vc === c)) return;
      performMove(r, c, current);
    },
    [board, current, flipping, humanColor, isAITurn, musicOn, performMove]
  );

  // Tour de l'IA.
  useEffect(() => {
    if (current !== aiColor) {
      setIsAITurn(false);
      return;
    }
    const moves = getValidMoves(board, aiColor);
    if (moves.length === 0) {
      const human = aiColor === BLACK ? WHITE : BLACK;
      const humanMoves = getValidMoves(board, human);
      if (humanMoves.length === 0) return;
      window.setTimeout(() => setCurrent(human), 400);
      return;
    }
    setIsAITurn(true);

    const cfg = LEVELS.find((l) => l.level === level) ?? LEVELS[2];
    aiTimeoutRef.current = window.setTimeout(() => {
      const move = pickAIMove(board, aiColor, level);
      if (move) {
        performMove(move[0], move[1], aiColor);
      }
    }, cfg.think);

    return () => {
      if (aiTimeoutRef.current) {
        window.clearTimeout(aiTimeoutRef.current);
        aiTimeoutRef.current = null;
      }
    };
  }, [current, aiColor, board, level, performMove]);

  const scores = useMemo(() => countDiscs(board), [board]);
  const validMoves = useMemo(
    () => (flipping.length > 0 ? [] : getValidMoves(board, current)),
    [board, current, flipping]
  );

  const isBoardFull = scores.black + scores.white === 64;
  const noMovesEither =
    getValidMoves(board, BLACK).length === 0 && getValidMoves(board, WHITE).length === 0;
  const gameOver = isBoardFull || noMovesEither;

  const userWon = useMemo(() => {
    if (!gameOver) return false;
    if (scores.black === scores.white) return false;
    const winner = scores.black > scores.white ? BLACK : WHITE;
    return winner === humanColor;
  }, [gameOver, scores, humanColor]);

  const winnerText = useMemo(() => {
    if (!gameOver) return "";
    if (scores.black > scores.white) return humanColor === BLACK ? "Vous gagnez ! 🎉" : "L'IA gagne 🤖";
    if (scores.white > scores.black) return humanColor === WHITE ? "Vous gagnez ! 🎉" : "L'IA gagne 🤖";
    return "Match nul 🤝";
  }, [gameOver, scores, humanColor]);

  // Son de fin de partie.
  useEffect(() => {
    if (gameOver && !winSoundPlayed.current && flipping.length === 0) {
      winSoundPlayed.current = true;
      const draw = scores.black === scores.white;
      if (draw) return;
      if (userWon) playWin();
      else playLose();
    }
  }, [gameOver, userWon, scores, flipping]);

  const undo = useCallback(() => {
    if (history.length < 2 || isAITurn || flipping.length > 0) return;
    const newHistory = history.slice(0, history.length - 2);
    const target = newHistory[newHistory.length - 1] ?? createInitialBoard();
    setHistory(newHistory);
    setBoard(target);
    setFlipping([]);
    setLastMove(null);
    setCurrent(humanColor);
  }, [history, humanColor, isAITurn, flipping]);

  // Synchronise l'état audio au montage.
  useEffect(() => {
    setSoundEnabledAudio(isSoundEnabled());
    setMusicEnabledAudio(isMusicEnabled());
  }, []);

  const value: GameContextValue = {
    board,
    current,
    scores,
    validMoves,
    humanColor,
    aiColor,
    level,
    flipping,
    lastMove,
    gameOver,
    winnerText,
    userWon,
    isAITurn,
    history,
    passNotice,
    soundOn,
    musicOn,
    setLevel,
    chooseHumanColor,
    play,
    reset,
    undo,
    toggleSound,
    toggleMusic,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame doit être utilisé dans un GameProvider");
  return ctx;
}
