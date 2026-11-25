import { memo, useMemo } from "react";
import { BLACK, WHITE, type Cell } from "../game/reversi";

type Props = {
  cell: Cell;
  flipping: boolean;
  delay: number;
  from: Cell;
  to: Cell;
  showHint?: boolean;
};

function DiscInner({ cell, flipping, delay, from, to, showHint }: Props) {
  // We render two faces of a "coin" and rotate around the Y axis.
  // During a flip, the front face holds the old color and the back face the new.
  const duration = 520; // ms - kept in sync with GameContext
  const animStyle = useMemo(
    () =>
      flipping
        ? ({
            animation: `discFlip ${duration}ms cubic-bezier(0.45, 0.05, 0.55, 0.95) ${delay}ms forwards`,
            transformStyle: "preserve-3d",
            WebkitTransformStyle: "preserve-3d",
          } as const)
        : undefined,
    [flipping, delay]
  );

  // Hint dot color
  const hintColor =
    !flipping && showHint
      ? to === BLACK
        ? "rgba(20,20,20,0.55)"
        : "rgba(255,255,255,0.75)"
      : null;

  // Non-flipping state: render a single clean face.
  if (!flipping) {
    return (
      <div className="relative h-full w-full">
        {cell === BLACK && <DiscFace color={BLACK} />}
        {cell === WHITE && <DiscFace color={WHITE} />}
        {cell === 0 && hintColor && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className="rounded-full transition-all duration-200 group-hover:scale-125 group-hover:opacity-90"
              style={{
                width: "34%",
                height: "34%",
                backgroundColor: hintColor,
                boxShadow: "0 0 12px rgba(0,0,0,0.25), inset 0 0 4px rgba(255,255,255,0.2)",
                animation: "hintPulse 2s ease-in-out infinite",
              }}
            />
          </div>
        )}
        <style>{`
          @keyframes discFlip {
            0% { transform: rotateY(0deg); }
            50% { transform: rotateY(90deg); }
            100% { transform: rotateY(180deg); }
          }
        `}</style>
      </div>
    );
  }

  // Flipping state: render two faces that rotate together.
  return (
    <div className="relative h-full w-full" style={{ perspective: "600px" }}>
      <div className="relative h-full w-full" style={animStyle}>
        <div
          className="absolute inset-0"
          style={{
            transform: "rotateY(0deg)",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            pointerEvents: "none",
          }}
        >
          <DiscFace color={from} />
        </div>
        <div
          className="absolute inset-0"
          style={{
            transform: "rotateY(180deg)",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            pointerEvents: "none",
          }}
        >
          <DiscFace color={to} />
        </div>
      </div>
      <style>{`
        @keyframes discFlip {
          0% { transform: rotateY(0deg); }
          50% { transform: rotateY(90deg); }
          100% { transform: rotateY(180deg); }
        }
        @keyframes hintPulse {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.08); opacity: 0.9; }
        }
      `}</style>
    </div>
  );
}

function DiscFace({ color }: { color: Cell }) {
  const black = color === BLACK;
  return (
    <div
      className="h-full w-full rounded-full"
      style={{
        background: black
          ? "radial-gradient(circle at 30% 30%, #5a5a66 0%, #1a1a22 55%, #0a0a0e 100%)"
          : "radial-gradient(circle at 30% 30%, #ffffff 0%, #f0f1f5 55%, #c8ccd6 100%)",
        boxShadow: black
          ? "inset 0 0 12px rgba(255,255,255,0.08), 0 4px 8px rgba(0,0,0,0.35), 0 0 0 1px rgba(0,0,0,0.4)"
          : "inset 0 0 12px rgba(0,0,0,0.06), 0 4px 8px rgba(0,0,0,0.25), 0 0 0 1px rgba(0,0,0,0.1)",
      }}
    />
  );
}

export const Disc = memo(DiscInner);
