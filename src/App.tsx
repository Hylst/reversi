import { GameProvider, useGame } from "./game/GameContext";
import { Board } from "./components/Board";
import { Sidebar } from "./components/Sidebar";
import { GameOverModal } from "./components/GameOverModal";
import { Toolbar } from "./components/Toolbar";

export default function App() {
  return (
    <GameProvider>
      <div
        className="min-h-screen w-full relative overflow-x-clip"
        style={{
          backgroundColor: "#020617",
          backgroundImage:
            "linear-gradient(rgba(2,6,23,0.55), rgba(2,6,23,0.85)), url('${import.meta.env.BASE_URL}images/bg-ambient.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        <div className="mx-auto max-w-6xl px-4 py-5 sm:py-8">
          <div className="flex items-center justify-between gap-3">
            <Header />
            <Toolbar />
          </div>

          <div className="mt-5 sm:mt-7 flex flex-col lg:flex-row gap-6 items-start justify-center">
            <div className="w-full max-w-[620px] mx-auto lg:mx-0 relative">
              <Board />
              <PassBanner />
            </div>
            <Sidebar />
          </div>

          <Footer />
        </div>
        <GameOverModal />
      </div>
    </GameProvider>
  );
}

function Header() {
  return (
    <div className="flex items-center gap-3">
      <div
        className="h-11 w-11 rounded-xl flex items-center justify-center shadow-lg shrink-0"
        style={{
          background: "linear-gradient(135deg, #2d6a4f 0%, #6366f1 60%, #8b5cf6 100%)",
          boxShadow: "0 8px 20px rgba(99,102,241,0.4)",
        }}
      >
        <svg
          className="h-6 w-6 text-white"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 3a9 9 0 0 1 0 18" fill="currentColor" stroke="none" />
        </svg>
      </div>
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-none">
          Reversi
          <span className="text-emerald-400"> · Othello</span>
        </h1>
        <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
          Le grand classique du retournement de pions
        </p>
      </div>
    </div>
  );
}

function PassBanner() {
  const { passNotice } = useGame();
  if (!passNotice) return null;
  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
      <div className="px-5 py-3 rounded-xl bg-slate-900/90 border border-amber-400/40 text-amber-200 font-semibold shadow-2xl animate-[fadeIn_0.3s_ease-out] backdrop-blur">
        Aucun coup possible — tour passé
      </div>
    </div>
  );
}

function Footer() {
  return (
    <div className="mt-8 text-center space-y-2">
      <p className="text-xs text-slate-400 max-w-2xl mx-auto leading-relaxed">
        Cliquez sur une case mise en surbrillance pour poser un pion. Encerclez
        les pions adverses — en ligne, en colonne ou en diagonale — pour les
        retourner à votre couleur. Le joueur possédant le plus de pions à la fin
        de la partie l'emporte.
      </p>
      <p className="text-[11px] text-slate-500">
        Créateur de l'app :{" "}
        <span className="font-semibold text-slate-300">Hylst — Geoffroy</span>{" "}
        avec l'aide d'une IA
      </p>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
