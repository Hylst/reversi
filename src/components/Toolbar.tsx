import { useEffect, useState } from "react";
import { useGame } from "../game/GameContext";
import { playClick, resumeAudio } from "../game/audio";

export function Toolbar() {
  const { soundOn, musicOn, toggleSound, toggleMusic } = useGame();
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = async () => {
    playClick();
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="flex items-center gap-2">
      <IconButton
        active={musicOn}
        onClick={() => {
          resumeAudio();
          playClick();
          toggleMusic();
        }}
        title={musicOn ? "Couper la musique" : "Activer la musique"}
        label="Musique"
      >
        {musicOn ? "🎵" : "🔇"}
      </IconButton>

      <IconButton
        active={soundOn}
        onClick={() => {
          resumeAudio();
          playClick();
          toggleSound();
        }}
        title={soundOn ? "Couper les effets" : "Activer les effets"}
        label="Effets"
      >
        {soundOn ? "🔊" : "🔈"}
      </IconButton>

      <IconButton
        active={isFullscreen}
        onClick={toggleFullscreen}
        title={isFullscreen ? "Quitter le plein écran" : "Mode plein écran"}
        label="Plein écran"
      >
        {isFullscreen ? "🗗" : "⛶"}
      </IconButton>
    </div>
  );
}

function IconButton({
  children,
  onClick,
  active,
  title,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active: boolean;
  title: string;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all border ${
        active
          ? "bg-white/10 border-violet-400/50 text-white shadow-lg"
          : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white"
      }`}
    >
      <span className="text-base leading-none">{children}</span>
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
