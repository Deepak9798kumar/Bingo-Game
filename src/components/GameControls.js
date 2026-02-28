import { motion } from "framer-motion";

export default function GameControls({
  isHost, gameStarted, gameFinished,
  playerCount, onStart, onEnd, onLeave,
}) {
  return (
    <div className="flex gap-2">
      {/* Start — host only, pre-game */}
      {isHost && !gameStarted && (
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onStart}
          disabled={playerCount < 2}
          className={[
            "flex-1 py-2.5 rounded-[10px] text-sm font-semibold transition-opacity",
            playerCount >= 2
              ? "brand-pill"
              : "bg-d-raised border border-d-border text-d-text3 cursor-not-allowed",
          ].join(" ")}
        >
          {playerCount < 2 ? "Waiting for players…" : "Start Game"}
        </motion.button>
      )}

      {/* End — host only, during game */}
      {isHost && gameStarted && !gameFinished && (
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onEnd}
          className="px-3.5 py-2.5 rounded-[10px] text-sm font-medium text-rose-400 bg-rose-500/[0.1] border border-rose-500/20"
        >
          End
        </motion.button>
      )}

      {/* Leave — always */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={onLeave}
        className="px-3.5 py-2.5 rounded-[10px] text-sm font-medium text-d-text2 glass-dark flex-shrink-0"
      >
        Leave
      </motion.button>
    </div>
  );
}
