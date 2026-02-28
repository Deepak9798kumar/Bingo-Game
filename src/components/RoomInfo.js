import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function RoomInfo({ roomId, playerCount }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try { await navigator.clipboard.writeText(roomId); }
    catch {
      const el = Object.assign(document.createElement("textarea"), { value: roomId });
      document.body.appendChild(el); el.select();
      document.execCommand("copy"); document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="glass flex items-center gap-3 px-4 py-3">
      {/* Room ID */}
      <div className="flex-1 min-w-0">
        <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-d-text3 mb-0.5">Room</p>
        <p className="text-base font-bold tracking-[0.14em] font-mono text-brand-300">{roomId}</p>
      </div>

      {/* Player count badge */}
      <span className="text-[11px] font-medium text-d-text2 bg-d-raised border border-d-border rounded-full px-2.5 py-1 flex-shrink-0">
        {playerCount}/6
      </span>

      {/* Copy button */}
      <motion.button
        whileTap={{ scale: 0.91 }}
        onClick={copy}
        className="text-[11px] font-semibold px-3 py-1.5 rounded-[8px] brand-pill flex-shrink-0"
        aria-label="Copy room ID"
      >
        <AnimatePresence mode="wait" initial={false}>
          {copied
            ? <motion.span key="ok"   initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>Copied!</motion.span>
            : <motion.span key="copy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>Copy ID</motion.span>
          }
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
