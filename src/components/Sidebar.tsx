import { LEVELS, useGame } from "../game/GameContext";
import { playClick } from "../game/audio";
import { BLACK, WHITE, type Cell } from "../game/reversi";

export function Sidebar() {
  const {
    scores,
    current,
    humanColor,
    aiColor,
    level,
    isAITurn,
    gameOver,
    winnerText,
    history,
    passNotice,
    setLevel,
    chooseHumanColor,
    reset,
    undo,
  } = useGame();

  const total = scores.black + scores.white;
  const blackPct = total === 0 ? 50 : (scores.black / total) * 100;
  const whitePct = total === 0 ? 50 : (scores.white / total) * 100;
  const currentLevel = LEVELS.find((l) => l.level === level) ?? LEVELS[2];

  return (
    <div className="flex flex-col gap-4 w-full lg:w-80">
      {/* Score */}
      <Panel>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            Score
          </h2>
          <span className="text-xs text-slate-500">{total} / 64</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <PlayerCard
            color={BLACK}
            label="Noir"
            score={scores.black}
            active={current === BLACK && !gameOver}
            isHuman={humanColor === BLACK}
            isAI={aiColor === BLACK}
            isAITurn={isAITurn && current === BLACK}
          />
          <PlayerCard
            color={WHITE}
            label="Blanc"
            score={scores.white}
            active={current === WHITE && !gameOver}
            isHuman={humanColor === WHITE}
            isAI={aiColor === WHITE}
            isAITurn={isAITurn && current === WHITE}
          />
        </div>

        <div className="mt-4 h-2.5 rounded-full bg-slate-700/50 overflow-hidden flex shadow-inner">
          <div
            className="h-full transition-all duration-700 ease-out"
            style={{
              width: `${blackPct}%`,
              background: "linear-gradient(90deg, #0a0a0e, #4a4a55)",
            }}
          />
          <div
            className="h-full transition-all duration-700 ease-out"
            style={{
              width: `${whitePct}%`,
              background: "linear-gradient(90deg, #d1d5db, #ffffff)",
            }}
          />
        </div>
      </Panel>

      {/* Statut */}
      <Panel>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-2">
          Statut
        </h2>
        {gameOver ? (
          <div>
            <p className="text-2xl font-bold text-white">{winnerText}</p>
            <p className="text-sm text-slate-400 mt-1">Partie terminée</p>
          </div>
        ) : (
          <div>
            <p className="text-lg font-semibold text-white flex items-center gap-2">
              {isAITurn ? (
                <>
                  <span className="inline-block h-2 w-2 rounded-full bg-violet-400 animate-pulse" />
                  L'IA réfléchit…
                </>
              ) : current === humanColor ? (
                <>
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  À vous de jouer
                </>
              ) : (
                <>
                  <span className="inline-block h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                  Tour de l'adversaire
                </>
              )}
            </p>
            <p className="text-sm text-slate-400 mt-1">
              {passNotice
                ? "Aucun coup possible, tour passé"
                : `${current === BLACK ? "Noir" : "Blanc"} doit jouer`}
            </p>
          </div>
        )}
      </Panel>

      {/* Réglages */}
      <Panel>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3">
          Réglages
        </h2>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-300 mb-1.5 block">
              Vous jouez les
            </label>
            <div className="grid grid-cols-2 gap-2">
              <ColorButton
                color={BLACK}
                label="Noirs"
                active={humanColor === BLACK}
                onClick={() => {
                  playClick();
                  chooseHumanColor(BLACK);
                }}
              />
              <ColorButton
                color={WHITE}
                label="Blancs"
                active={humanColor === WHITE}
                onClick={() => {
                  playClick();
                  chooseHumanColor(WHITE);
                }}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-slate-300">
                Niveau de difficulté
              </label>
              <span className="text-xs font-semibold text-violet-300">
                {currentLevel.name}
              </span>
            </div>
            <div className="grid grid-cols-6 gap-1">
              {LEVELS.map((l) => (
                <button
                  key={l.level}
                  onClick={() => {
                    playClick();
                    setLevel(l.level);
                  }}
                  title={`${l.name} : ${l.desc}`}
                  className={`py-2 rounded-lg text-xs font-bold transition-all ${
                    level === l.level
                      ? "bg-gradient-to-b from-violet-500 to-indigo-600 text-white shadow-lg shadow-indigo-900/50 scale-105"
                      : "bg-slate-700/60 text-slate-300 hover:bg-slate-600/60"
                  }`}
                >
                  {l.level}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5 italic">
              {currentLevel.desc}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => {
                playClick();
                undo();
              }}
              disabled={history.length < 2 || isAITurn}
              className="py-2.5 rounded-lg text-sm font-semibold bg-slate-700/60 text-slate-200 hover:bg-slate-600/60 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              ↩ Annuler
            </button>
            <button
              onClick={() => {
                playClick();
                reset();
              }}
              className="py-2.5 rounded-lg text-sm font-semibold bg-gradient-to-r from-violet-500 to-indigo-600 text-white hover:shadow-lg hover:shadow-indigo-900/50 transition-all"
            >
              ⟳ Nouvelle
            </button>
          </div>
        </div>
      </Panel>
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl p-5 shadow-2xl border border-white/10"
      style={{
        background:
          "linear-gradient(135deg, rgba(30,41,59,0.75) 0%, rgba(15,23,42,0.85) 100%)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
      }}
    >
      {children}
    </div>
  );
}

function PlayerCard({
  color,
  label,
  score,
  active,
  isHuman,
  isAI,
  isAITurn,
}: {
  color: Cell;
  label: string;
  score: number;
  active: boolean;
  isHuman: boolean;
  isAI: boolean;
  isAITurn: boolean;
}) {
  const black = color === BLACK;
  return (
    <div
      className={`relative rounded-xl p-3 transition-all duration-300 ${
        active ? "ring-2 ring-offset-2 ring-violet-400 ring-offset-slate-900 scale-[1.03]" : ""
      }`}
      style={{
        background: black
          ? "linear-gradient(135deg, #1a1a22 0%, #2a2a35 100%)"
          : "linear-gradient(135deg, #ffffff 0%, #e5e7eb 100%)",
        boxShadow: active
          ? "0 8px 20px rgba(139,92,246,0.35)"
          : "0 4px 10px rgba(0,0,0,0.3)",
      }}
    >
      <div className="flex items-center gap-2">
        <div
          className="h-5 w-5 rounded-full shrink-0"
          style={{
            background: black
              ? "radial-gradient(circle at 30% 30%, #5a5a66 0%, #1a1a22 55%, #0a0a0e 100%)"
              : "radial-gradient(circle at 30% 30%, #ffffff 0%, #f0f1f5 55%, #c8ccd6 100%)",
            boxShadow: "inset 0 0 4px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.3)",
          }}
        />
        <div className="flex-1 min-w-0">
          <div className={`text-xs font-semibold ${black ? "text-slate-300" : "text-slate-600"}`}>
            {label}
          </div>
          <div className={`text-[10px] ${black ? "text-slate-400" : "text-slate-500"}`}>
            {isHuman ? "Vous" : isAI ? "IA" : "-"}
          </div>
        </div>
        {isAITurn && (
          <span className={`text-[10px] font-semibold animate-pulse ${black ? "text-violet-300" : "text-violet-600"}`}>
            ●
          </span>
        )}
      </div>
      <div className={`mt-2 text-3xl font-bold tabular-nums ${black ? "text-white" : "text-slate-800"}`}>
        {score}
      </div>
    </div>
  );
}

function ColorButton({
  color,
  label,
  active,
  onClick,
}: {
  color: Cell;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  const black = color === BLACK;
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${
        active
          ? "bg-white/10 text-white ring-2 ring-violet-400 ring-offset-2 ring-offset-slate-900"
          : "bg-slate-700/60 text-slate-300 hover:bg-slate-600/60"
      }`}
    >
      <div
        className="h-4 w-4 rounded-full"
        style={{
          background: black
            ? "radial-gradient(circle at 30% 30%, #5a5a66 0%, #1a1a22 55%, #0a0a0e 100%)"
            : "radial-gradient(circle at 30% 30%, #ffffff 0%, #f0f1f5 55%, #c8ccd6 100%)",
          boxShadow: "inset 0 0 3px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.3)",
        }}
      />
      {label}
    </button>
  );
}
