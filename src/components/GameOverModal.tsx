import { LEVELS, useGame } from "../game/GameContext";
import { playClick } from "../game/audio";

export function GameOverModal() {
  const { gameOver, winnerText, scores, userWon, level, reset } = useGame();
  if (!gameOver) return null;

  const draw = scores.black === scores.white;
  const currentLevel = LEVELS.find((l) => l.level === level) ?? LEVELS[2];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-[mFade_0.3s_ease-out]">
      {/* Confettis si victoire */}
      {userWon && <Confetti />}

      <div
        className="relative rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-[mPop_0.4s_cubic-bezier(0.34,1.56,0.64,1)]"
        style={{
          background: "linear-gradient(135deg, rgba(30,41,59,0.98) 0%, rgba(15,23,42,1) 100%)",
          border: "1px solid rgba(255,255,255,0.12)",
        }}
      >
        <div className="flex justify-center gap-6 mb-5">
          <ScoreCircle dark score={scores.black} label="Noir" win={!draw && scores.black > scores.white} />
          <div className="text-3xl font-light text-slate-500 self-center">vs</div>
          <ScoreCircle score={scores.white} label="Blanc" win={!draw && scores.white > scores.black} />
        </div>

        <div className="text-center">
          <div className="text-xs uppercase tracking-wider text-slate-400 mb-1">
            {draw ? "Résultat" : "Vainqueur"}
          </div>
          <div
            className={`text-3xl font-extrabold mb-1 ${
              userWon
                ? "bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent"
                : draw
                ? "text-slate-200"
                : "bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent"
            }`}
          >
            {draw ? "Match nul 🤝" : userWon ? "Victoire ! 🎉" : "Défaite 🤖"}
          </div>
          <p className="text-sm text-slate-400">{winnerText}</p>
          <p className="text-xs text-slate-500 mt-2">
            Niveau : <span className="text-slate-300 font-semibold">{currentLevel.name}</span>
          </p>
        </div>

        <button
          onClick={() => {
            playClick();
            reset();
          }}
          className="mt-6 w-full py-3 rounded-xl text-sm font-bold bg-gradient-to-r from-violet-500 to-indigo-600 text-white shadow-lg shadow-indigo-900/50 hover:shadow-xl hover:scale-[1.02] transition-all"
        >
          ⟳ Rejouer
        </button>
      </div>

      <style>{`
        @keyframes mFade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes mPop {
          from { opacity: 0; transform: scale(0.85) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes confettiFall {
          0% { transform: translateY(-20vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function ScoreCircle({
  score,
  label,
  dark,
  win,
}: {
  score: number;
  label: string;
  dark?: boolean;
  win?: boolean;
}) {
  return (
    <div className="text-center">
      <div
        className={`mx-auto h-16 w-16 rounded-full relative ${win ? "ring-2 ring-amber-300 ring-offset-2 ring-offset-slate-900" : ""}`}
        style={{
          background: dark
            ? "radial-gradient(circle at 30% 30%, #5a5a66 0%, #1a1a22 55%, #0a0a0e 100%)"
            : "radial-gradient(circle at 30% 30%, #ffffff 0%, #f0f1f5 55%, #c8ccd6 100%)",
          boxShadow: dark
            ? "inset 0 0 8px rgba(255,255,255,0.08), 0 4px 12px rgba(0,0,0,0.4)"
            : "inset 0 0 8px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.3)",
        }}
      >
        {win && (
          <span className="absolute -top-2 -right-1 text-lg">👑</span>
        )}
      </div>
      <div className="mt-2 text-2xl font-bold text-white">{score}</div>
      <div className="text-[10px] uppercase tracking-wider text-slate-400">{label}</div>
    </div>
  );
}

function Confetti() {
  const colors = ["#8b5cf6", "#6366f1", "#10b981", "#f59e0b", "#ef4444", "#ffffff"];
  const pieces = Array.from({ length: 60 });
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {pieces.map((_, i) => {
        const left = Math.random() * 100;
        const delay = Math.random() * 0.8;
        const dur = 2.5 + Math.random() * 2;
        const size = 6 + Math.random() * 8;
        const color = colors[i % colors.length];
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${left}%`,
              top: "-5vh",
              width: size,
              height: size * 0.5,
              background: color,
              borderRadius: 2,
              animation: `confettiFall ${dur}s linear ${delay}s infinite`,
            }}
          />
        );
      })}
    </div>
  );
}
