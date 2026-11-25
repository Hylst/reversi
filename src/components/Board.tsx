import { useGame } from "../game/GameContext";
import { BOARD_SIZE, type Cell } from "../game/reversi";
import { Disc } from "./Disc";

export function Board() {
  const { board, validMoves, flipping, lastMove, humanColor, play, current, isAITurn } = useGame();

  const isValid = (r: number, c: number) =>
    validMoves.some(([vr, vc]) => vr === r && vc === c);

  const flipMap = new Map<string, { from: Cell; to: Cell; delay: number }>();
  for (const f of flipping) {
    flipMap.set(`${f.row},${f.col}`, { from: f.from, to: f.to, delay: f.delay });
  }

  const isLast = (r: number, c: number) =>
    lastMove && lastMove[0] === r && lastMove[1] === c;

  return (
    <div className="relative">
      {/* Halo lumineux derrière le plateau */}
      <div
        className="absolute -inset-6 rounded-[2rem] opacity-60 blur-2xl pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(45,106,79,0.5) 0%, rgba(16,185,129,0.15) 40%, transparent 70%)",
        }}
      />

      {/* Cadre en bois du plateau */}
      <div
        className="relative rounded-2xl p-3 sm:p-4"
        style={{
          background:
            "linear-gradient(145deg, #3a2418 0%, #2a1a10 50%, #1a0f08 100%)",
          boxShadow:
            "0 30px 60px -15px rgba(0,0,0,0.7), inset 0 2px 0 rgba(255,255,255,0.08), inset 0 0 0 1px rgba(0,0,0,0.5)",
        }}
      >
        {/* Liseré doré */}
        <div
          className="rounded-xl p-2 sm:p-3"
          style={{
            background:
              "linear-gradient(145deg, #1b4332 0%, #081c15 100%)",
            boxShadow: "inset 0 0 0 2px rgba(212,175,55,0.25)",
          }}
        >
          {/* Coordonnées du haut */}
          <div className="flex pl-6 sm:pl-7 pr-1 mb-1">
            {Array.from({ length: BOARD_SIZE }).map((_, c) => (
              <div
                key={c}
                className="flex-1 text-center text-[10px] sm:text-xs font-bold text-amber-200/50"
              >
                {String.fromCharCode(65 + c)}
              </div>
            ))}
          </div>

          <div className="flex">
            {/* Coordonnées de gauche */}
            <div className="flex flex-col w-5 sm:w-6 mr-1">
              {Array.from({ length: BOARD_SIZE }).map((_, r) => (
                <div
                  key={r}
                  className="flex-1 flex items-center justify-center text-[10px] sm:text-xs font-bold text-amber-200/50"
                >
                  {r + 1}
                </div>
              ))}
            </div>

            {/* Grille */}
            <div
              className="relative grid flex-1 gap-px rounded-lg overflow-hidden"
              style={{
                gridTemplateColumns: `repeat(${BOARD_SIZE}, minmax(0, 1fr))`,
                aspectRatio: "1 / 1",
                background: "rgba(8,28,21,0.6)",
                boxShadow: "inset 0 0 30px rgba(0,0,0,0.6)",
              }}
            >
              {board.map((row, r) =>
                row.map((cell, c) => {
                  const flipInfo = flipMap.get(`${r},${c}`);
                  const valid = isValid(r, c);
                  const isHuman = current === humanColor && !isAITurn;
                  const showHint = valid && isHuman && cell === 0;
                  const checker = (r + c) % 2 === 0;
                  return (
                    <button
                      key={`${r}-${c}`}
                      onClick={() => play(r, c)}
                      disabled={!valid || isAITurn || flipping.length > 0}
                      className={`group relative aspect-square flex items-center justify-center transition-all duration-150 ${
                        showHint ? "cursor-pointer" : "cursor-default"
                      } ${valid && isHuman ? "hover:brightness-125" : ""}`}
                      style={{
                        background: checker
                          ? "linear-gradient(135deg, #2d6a4f 0%, #226047 100%)"
                          : "linear-gradient(135deg, #2a624a 0%, #1f5942 100%)",
                      }}
                      aria-label={`Case ${String.fromCharCode(65 + c)}${r + 1}`}
                    >
                      {/* Points de repère (cases standard) */}
                      {((r === 2 && c === 2) ||
                        (r === 2 && c === 6) ||
                        (r === 6 && c === 2) ||
                        (r === 6 && c === 6)) && (
                        <div className="absolute -top-px -left-px h-1.5 w-1.5 rounded-full bg-emerald-950/50 pointer-events-none" />
                      )}

                      {/* Marqueur du dernier coup */}
                      {isLast(r, c) && (
                        <div
                          className="absolute inset-1 rounded-md ring-2 ring-amber-300/80 pointer-events-none animate-[lastPulse_1.5s_ease-in-out_infinite]"
                          style={{ boxShadow: "0 0 14px rgba(252,211,77,0.6)" }}
                        />
                      )}

                      {/* Surbrillance de survol pour coups valides */}
                      {showHint && (
                        <div className="absolute inset-0 rounded-sm bg-violet-400/0 group-hover:bg-violet-400/15 transition-colors pointer-events-none" />
                      )}

                      {/* Pion */}
                      {cell !== 0 || flipInfo ? (
                        <div className="absolute inset-1.5 sm:inset-2">
                          <Disc
                            cell={cell}
                            flipping={!!flipInfo}
                            delay={flipInfo?.delay ?? 0}
                            from={flipInfo?.from ?? cell}
                            to={flipInfo?.to ?? cell}
                          />
                        </div>
                      ) : showHint ? (
                        <div className="absolute inset-1.5 sm:inset-2 pointer-events-none">
                          <Disc cell={0} flipping={false} delay={0} from={0} to={current} showHint />
                        </div>
                      ) : null}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes lastPulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
