import { motion } from "framer-motion";

// Public player list — only name + whose turn. Bingo counts are private.
export default function PlayerStatus({ players, mySocketId, currentTurnPlayerId }) {
  return (
    <div className="space-y-1.5">
      {players.map((player) => {
        const isMe   = player.id === mySocketId;
        const isTurn = player.id === currentTurnPlayerId;
        const letter = (player.name?.[0] ?? "?").toUpperCase();

        return (
          <motion.div
            key={player.id}
            layout
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.18 }}
            className={[
              "flex items-center gap-2.5 px-3 py-2 rounded-[10px] transition-colors duration-150",
              isTurn
                ? "bg-brand-500/[0.12] border border-brand-500/25"
                : isMe
                  ? "bg-d-raised border border-d-border2"
                  : "bg-d-surface border border-d-border",
            ].join(" ")}
          >
            {/* Avatar */}
            <div className={[
              "w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0",
              isMe ? "bg-brand-gradient text-white" : "bg-d-border2 text-d-text2",
            ].join(" ")}>
              {letter}
            </div>

            {/* Name */}
            <span className={[
              "text-[13px] font-medium flex-1 truncate",
              isMe ? "text-d-text" : "text-d-text2",
            ].join(" ")}>
              {player.name}
              {isMe && <span className="text-brand-400 ml-1 text-[11px] font-normal">(you)</span>}
            </span>

            {/* Turn indicator */}
            {isTurn && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-2 h-2 rounded-full bg-brand-400 flex-shrink-0 animate-pulse-s"
              />
            )}

            {/* Win badge */}
            {player.hasWon && (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-[4px] bg-gold-gradient text-d-base">
                Won
              </span>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
