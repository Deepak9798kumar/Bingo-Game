import { motion, AnimatePresence } from "framer-motion";

export default function TurnIndicator({ isMyTurn, currentTurnPlayerName, lastCalledNumber, callerName }) {
  return (
    <div className="space-y-2">
      {/* Active turn banner */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentTurnPlayerName + String(isMyTurn)}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.2 }}
          className={[
            "flex items-center gap-2.5 px-3.5 py-2.5 rounded-[10px] text-sm font-medium",
            isMyTurn
              ? "bg-brand-600 text-white"
              : "glass-dark text-d-text2",
          ].join(" ")}
        >
          <span className={[
            "w-2 h-2 rounded-full flex-shrink-0",
            isMyTurn ? "bg-white/60 animate-pulse-s" : "bg-d-border2",
          ].join(" ")} />
          {isMyTurn
            ? "Your turn — tap a number"
            : (<><span className="text-d-text font-semibold">{currentTurnPlayerName}</span>&rsquo;s turn</>)
          }
        </motion.div>
      </AnimatePresence>

      {/* Last called */}
      <AnimatePresence>
        {lastCalledNumber && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.18 }}
            className="flex items-center gap-3 glass-dark px-3.5 py-2.5"
          >
            <div className="w-9 h-9 rounded-[9px] bg-brand-gradient text-white flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-brand-glow">
              {lastCalledNumber}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-d-text3 uppercase tracking-wider">Last called</p>
              <p className="text-sm font-medium text-d-text truncate">
                <span className="text-brand-300">{callerName}</span> called&nbsp;
                <span className="font-semibold">{lastCalledNumber}</span>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
