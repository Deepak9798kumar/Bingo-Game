import { motion, AnimatePresence } from "framer-motion";

const COLORS = ["#818CF8","#C084FC","#FBBF24","#34D399","#F472B6","#6366F1"];

function Confetti() {
  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden" aria-hidden>
      {Array.from({ length: 48 }).map((_, i) => (
        <motion.div
          key={i}
          style={{
            position: "absolute",
            width: 7,
            height: 7,
            borderRadius: 1.5,
            backgroundColor: COLORS[i % COLORS.length],
            left: `${Math.random() * 100}%`,
            top: "-10px",
          }}
          animate={{
            y: ["0vh", "105vh"],
            rotate: [0, Math.random() > 0.5 ? 480 : -480],
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: 1.8 + Math.random() * 1.4,
            delay: Math.random() * 1.2,
            ease: "easeIn",
          }}
        />
      ))}
    </div>
  );
}

export default function WinnerModal({ winnerName, isWinner, onClose }) {
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {isWinner && <Confetti />}

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="relative z-10 w-full max-w-[320px] glass shadow-glass p-7 text-center"
        >
          <div className="text-4xl mb-4 leading-none">
            {isWinner ? "🎉" : "🏅"}
          </div>

          <h2 className="text-lg font-bold text-d-text mb-1">
            {isWinner ? "You got BINGO!" : "Game over"}
          </h2>

          <p className="text-sm text-d-text2 mb-6 leading-relaxed">
            {isWinner
              ? "Congratulations — you completed 5 lines!"
              : (<><span className="font-semibold text-d-text">{winnerName}</span> completed BINGO first.</>) 
            }
          </p>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="w-full py-2.5 rounded-[10px] brand-pill text-sm font-semibold"
          >
            Close
          </motion.button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
