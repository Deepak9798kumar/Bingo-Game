import { motion } from "framer-motion";

export default function CalledNumbers({ numbers }) {
  if (!numbers?.length) return null;
  return (
    <div>
      <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-d-text3 mb-2">
        Called &middot; {numbers.length}/25
      </p>
      <div className="flex flex-wrap gap-1.5 max-h-[68px] overflow-y-auto">
        {numbers.map((n) => (
          <motion.span
            key={n}
            initial={{ opacity: 0, scale: 0.75 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.14 }}
            className="w-7 h-7 rounded-[7px] bg-d-raised border border-d-border text-[11px] font-medium text-d-text2 flex items-center justify-center flex-shrink-0 tabular-nums"
          >
            {n}
          </motion.span>
        ))}
      </div>
    </div>
  );
}
