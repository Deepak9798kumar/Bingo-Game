// Private to each user — never shown to other players
import { motion } from "framer-motion";

const LETTERS = ["B","I","N","G","O"];

export default function BingoProgress({ count }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-d-text3 mr-1">
        Lines
      </span>
      {LETTERS.map((l, i) => {
        const active = i < count;
        return (
          <motion.div
            key={l}
            animate={active ? { scale: [1, 1.12, 1] } : {}}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className={[
              "w-8 h-8 rounded-[8px] flex items-center justify-center text-[13px] font-bold transition-all duration-200",
              active
                ? "bg-gold-gradient text-d-base shadow-gold-glow"
                : "bg-d-raised border border-d-border text-d-text3",
            ].join(" ")}
          >
            {l}
          </motion.div>
        );
      })}
    </div>
  );
}
