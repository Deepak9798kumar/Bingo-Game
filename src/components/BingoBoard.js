import { motion } from "framer-motion";
import BingoCell from "./BingoCell";

export default function BingoBoard({ board, markedNumbers, lines, isMyTurn, gameStarted, onSelectNumber }) {
  const markedSet = new Set(markedNumbers);

  return (
    <div className="w-full" style={{ maxWidth: 308 }} aria-label="Bingo board">
      {/* BINGO column labels */}
      <div className="grid grid-cols-5 gap-1.5 mb-1.5">
        {["B","I","N","G","O"].map((l) => (
          <div key={l} className="flex items-center justify-center h-6 text-[10px] font-semibold uppercase tracking-[0.18em] text-d-text3">
            {l}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-5 gap-1.5">
        {board.map((num, idx) => (
          <motion.div
            key={num}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.01, duration: 0.18, ease: "easeOut" }}
          >
            <BingoCell
              number={num}
              isMarked={markedSet.has(num)}
              cellIndex={idx}
              lines={lines}
              isMyTurn={isMyTurn}
              gameStarted={gameStarted}
              onClick={() => onSelectNumber(num)}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
