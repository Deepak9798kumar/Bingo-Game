import { motion } from "framer-motion";
import { isCellInLine } from "@/lib/gameLogic";

export default function BingoCell({
  number, isMarked, cellIndex, lines,
  isMyTurn, gameStarted, onClick,
}) {
  const inLine    = isMarked && isCellInLine(cellIndex, lines);
  const canSelect = isMyTurn && gameStarted && !isMarked;

  // visual state classes
  const base = "relative w-full aspect-square flex items-center justify-center rounded-[9px] text-sm font-semibold select-none transition-all duration-150";

  let stateClass;
  if (inLine) {
    stateClass = "bg-gold-500/[0.18] border border-gold-400/50 text-gold-300 shadow-gold-glow";
  } else if (isMarked) {
    // show marked numbers with a red "cut" style
    stateClass = "bg-red-600/[0.12] border border-red-500/30 text-red-400 line-through decoration-red-400/60";
  } else if (canSelect) {
    stateClass = "bg-d-raised border border-d-border2 text-d-text hover:border-brand-500/50 hover:bg-brand-500/[0.08] cursor-pointer";
  } else {
    stateClass = "bg-d-raised border border-d-border text-d-text2 cursor-default";
  }

  return (
    <motion.button
      whileTap={canSelect ? { scale: 0.92 } : {}}
      onClick={canSelect ? onClick : undefined}
      disabled={!canSelect}
      className={`${base} ${stateClass}`}
      aria-label={`${number}${isMarked ? " marked" : ""}`}
    >
      {/* Completed-line subtle pulse */}
      {inLine && (
        <motion.span
          animate={{ opacity: [0.12, 0.28, 0.12] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 rounded-[9px] bg-gold-400/20 pointer-events-none"
        />
      )}
      <span className="relative z-10 leading-none tabular-nums">{number}</span>
    </motion.button>
  );
}
