import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { motion, AnimatePresence } from "framer-motion";
import { useSocket } from "@/hooks/useSocket";

export default function Home() {
  const router = useRouter();
  const { emit, connected } = useSocket();

  const [view, setView]         = useState("home");   
  const [playerName, setName]   = useState("");
  const [roomId, setRoomId]     = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  useEffect(() => {
    if (router.query.room) {
      setRoomId(router.query.room.toUpperCase());
      setView("join");
    }
  }, [router.query]);

  function validate(requireRoom = false) {
    let name = playerName.trim();
    if (!name)         { setError("Please enter your name."); return null; }
    if (name.length > 16) { setError("Name must be 16 characters or fewer."); return null; }

    const lower = name.toLowerCase();
    if (["kajal", "kaja", "kaj"].includes(lower)) {
      name = "Kajaliya";
    }
    if (requireRoom) {
      const room = roomId.trim().toUpperCase();
      if (!room)       { setError("Please enter a Room ID."); return null; }
      if (room.length !== 6) { setError("Room ID must be 6 characters."); return null; }
      return { name, room };
    }
    return { name };
  }

  function handleCreate() {
    const v = validate();
    if (!v) return;
    setError("");
    setLoading(true);
    emit("create_room", { playerName: v.name }, (res) => {
      setLoading(false);
      if (res.success) {
        sessionStorage.setItem("bingo_name",  v.name);
        sessionStorage.setItem("bingo_board", JSON.stringify(res.board));
        sessionStorage.setItem("bingo_room",  res.roomId);
        if (res.playerId) sessionStorage.setItem("bingo_playerId", res.playerId);
        router.push(`/room/${res.roomId}`);
      } else {
        setError(res.error || "Could not create room.");
      }
    });
  }

  function handleJoin() {
    const v = validate(true);
    if (!v) return;
    setError("");
    setLoading(true);
    emit("join_room", { playerName: v.name, roomId: v.room }, (res) => {
      setLoading(false);
      if (res.success) {
        sessionStorage.setItem("bingo_name",  v.name);
        sessionStorage.setItem("bingo_board", JSON.stringify(res.board));
        sessionStorage.setItem("bingo_room",  v.room);
        if (res.playerId) sessionStorage.setItem("bingo_playerId", res.playerId);
        router.push(`/room/${v.room}`);
      } else {
        setError(res.error || "Could not join room.");
      }
    });
  }

  function onKey(e, action) {
    if (e.key === "Enter") action();
  }

  return (
    <>
      <Head>
        <title>Bingo — Multiplayer</title>
      </Head>

      <div className="page-bg min-h-dvh flex flex-col items-center justify-center px-5 py-10">

        {/* ── Brand mark ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center justify-center w-14 h-14 brand-pill rounded-2xl mb-5 shadow-brand-glow">
            <span className="text-2xl">🎯</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-d-text">Bingo</h1>
          <p className="text-sm text-d-text2 mt-1">Real-time multiplayer · up to 6 players</p>
        </motion.div>

        {/* ── Card ───────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.07 }}
          className="w-full max-w-[360px] glass shadow-glass p-6 space-y-4"
        >

          {/* Name field — always visible */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-semibold text-d-text3 uppercase tracking-[0.16em]">
              Your name
            </label>
            <input
              type="text"
              maxLength={16}
              value={playerName}
              onChange={(e) => { setName(e.target.value); setError(""); }}
              onKeyDown={(e) => onKey(e, view === "join" ? handleJoin : handleCreate)}
              placeholder="e.g. Alex"
              autoFocus
              className="w-full border border-d-border2 rounded-[10px] px-3.5 py-2.5 text-sm text-d-text placeholder-d-text3 bg-d-raised focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500/60 outline-none transition-all"
            />
          </div>

          {/* Room ID field — only in join view */}
          <AnimatePresence>
            {view === "join" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden space-y-1.5"
              >
                <label className="text-[10px] font-semibold text-d-text3 uppercase tracking-[0.16em]">
                  Room ID
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={roomId}
                  onChange={(e) => { setRoomId(e.target.value.toUpperCase()); setError(""); }}
                  onKeyDown={(e) => onKey(e, handleJoin)}
                  placeholder="e.g. AB12CD"
                  className="w-full border border-d-border2 rounded-[10px] px-3.5 py-2.5 text-sm font-mono uppercase tracking-[0.15em] text-d-text placeholder-d-text3 bg-d-raised focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500/60 outline-none transition-all"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-[13px] text-red-500 font-medium"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Actions */}
          <div className="space-y-2.5 pt-1">
            {view === "home" ? (
              <>
                {/* Create Room */}
                <Btn
                  primary
                  loading={loading}
                  disabled={!connected}
                  onClick={handleCreate}
                  label="Create Room"
                  loadingLabel="Creating…"
                />
                {/* Join Room — opens join view */}
                <Btn
                  onClick={() => { setView("join"); setError(""); }}
                  label="Join a Room"
                />
              </>
            ) : (
              <>
                {/* Join Room confirm */}
                <Btn
                  primary
                  loading={loading}
                  disabled={!connected}
                  onClick={handleJoin}
                  label="Join Room"
                  loadingLabel="Joining…"
                />
                {/* Back */}
                <Btn
                  onClick={() => { setView("home"); setError(""); setRoomId(""); }}
                  label="← Back"
                />
              </>
            )}
          </div>
        </motion.div>

        {/* Connection status */}
        <p className={`mt-6 text-xs font-medium transition-colors ${connected ? "text-d-text3" : "text-rose-400"}`}>
          {connected ? "Connected" : "Connecting to server…"}
        </p>
      </div>
    </>
  );
}

/* ── Reusable button ──────────────────────────────────────────────────────── */
function Btn({ primary, loading, disabled, onClick, label, loadingLabel }) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      disabled={loading || disabled}
      className={[
        "w-full py-3 rounded-[10px] text-sm font-semibold transition-all",
        primary
          ? "brand-pill disabled:opacity-40"
          : "glass-dark text-d-text2 hover:text-d-text",
      ].join(" ")}
    >
      {loading && primary ? (
        <span className="flex items-center justify-center gap-2">
          <Spinner /> {loadingLabel}
        </span>
      ) : label}
    </motion.button>
  );
}

function Spinner() {
  return (
    <motion.span
      animate={{ rotate: 360 }}
      transition={{ duration: 0.75, repeat: Infinity, ease: "linear" }}
      className="inline-block w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent"
    />
  );
}
