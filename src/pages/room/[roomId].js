import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { motion, AnimatePresence } from "framer-motion";
import { useSocket } from "@/hooks/useSocket";

import BingoBoard     from "@/components/BingoBoard";
import BingoProgress  from "@/components/BingoProgress";
import PlayerStatus   from "@/components/PlayerStatus";
import TurnIndicator  from "@/components/TurnIndicator";
import RoomInfo       from "@/components/RoomInfo";
import GameControls   from "@/components/GameControls";
import CalledNumbers  from "@/components/CalledNumbers";
import WinnerModal    from "@/components/WinnerModal";

export default function RoomPage() {
  const router = useRouter();
  const { roomId } = router.query;
  const { emit, on, connected, subscribeChannels, clientInfo } = useSocket();

  
  const [myName,  setMyName]  = useState("");
  const [myBoard, setMyBoard] = useState([]);
  const [myId, setMyId] = useState(null);

  
  const [players,      setPlayers]      = useState([]);
  const [hostId,       setHostId]       = useState(null);

  
  const [gameStarted,  setGameStarted]  = useState(false);
  const [gameFinished, setGameFinished] = useState(false);

  
  const [markedNumbers, setMarkedNumbers] = useState([]);
  const [lines,         setLines]         = useState([]);
  const [bingoCount,    setBingoCount]    = useState(0);

  
  const [currentTurnId,   setCurrentTurnId]   = useState(null);
  const [currentTurnName, setCurrentTurnName] = useState("");

  
  const [calledNumbers, setCalledNumbers] = useState([]);
  const [lastCalled,    setLastCalled]    = useState(null);
  const [callerName,    setCallerName]    = useState("");

  
  const [winnerInfo, setWinnerInfo] = useState(null);
  const [showModal,  setShowModal]  = useState(false);

  
  const [toast, setToast] = useState("");
  const toastRef = useRef(null);
  const showToast = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastRef.current);
    toastRef.current = setTimeout(() => setToast(""), 3000);
  }, []);

  
  useEffect(() => {
    if (!router.isReady) return;
    const name  = sessionStorage.getItem("bingo_name");
    const board = sessionStorage.getItem("bingo_board");
    const room  = sessionStorage.getItem("bingo_room");
    const player = sessionStorage.getItem("bingo_playerId");
    if (!name || !board || !room || room !== roomId) {
      router.replace("/"); return;
    }
    setMyName(name);
    setMyBoard(JSON.parse(board));
    // set local player id (client-only)
    setMyId(clientInfo?.playerId || player || null);
    // subscribe to Pusher channels if we already have playerId
    if (player && roomId) subscribeChannels(roomId, player);
  }, [router.isReady, roomId]);

  
  const selfAddedRef = useRef(false);
  useEffect(() => {
    const playerId = clientInfo?.playerId || myId;
    if (!playerId || !myName || selfAddedRef.current) return;
    selfAddedRef.current = true;
    setPlayers((prev) => {
      if (prev.find((p) => p.id === playerId)) return prev;
      return [...prev, { id: playerId, name: myName, bingoCount: 0, hasWon: false }];
    });
  }, [clientInfo?.playerId, myId, myName]);

  // Derive host from first player when not explicitly set
  useEffect(() => {
    if (!hostId && players.length > 0) setHostId(players[0].id);
  }, [players, hostId]);

  useEffect(() => {
    if (!roomId) return;
    const unsubs = [];

    unsubs.push(on("player_joined", ({ playerList }) => {
      setPlayers(playerList);
      const newest = playerList[playerList.length - 1];
      if (newest?.id !== myId) showToast(`${newest?.name} joined`);
    }));

    unsubs.push(on("game_started", ({ currentTurnPlayerId, currentTurnPlayerName, playerList }) => {
      setGameStarted(true);
      setGameFinished(false); // Reset finished state for Play Again
      setCurrentTurnId(currentTurnPlayerId);
      setCurrentTurnName(currentTurnPlayerName);
      setPlayers(playerList);
    }));

    unsubs.push(on("number_called", ({
      number, calledNumbers: called, callerName: caller,
      nextTurnPlayerId, nextTurnPlayerName, playerUpdates,
    }) => {
      setCalledNumbers(called);
      setLastCalled(number);
      setCallerName(caller);
      setCurrentTurnId(nextTurnPlayerId);
      setCurrentTurnName(nextTurnPlayerName);
      setPlayers((prev) => prev.map((p) => {
        const u = playerUpdates.find((x) => x.id === p.id);
        return u ? { ...p, bingoCount: u.bingoCount, hasWon: u.hasWon } : p;
      }));
    }));

    unsubs.push(on("board_update", ({ board: newBoard, markedNumbers: mn, lines: ln, bingoCount: bc }) => {
      if (Array.isArray(newBoard) && newBoard.length === 25) {
        setMyBoard(newBoard);
        try { sessionStorage.setItem("bingo_board", JSON.stringify(newBoard)); } catch (e) {}
      }
      setMarkedNumbers(mn);
      setLines(ln);
      setBingoCount(bc);
    }));

    unsubs.push(on("game_over", ({ winnerId, winnerName, calledNumbers: called, playerUpdates }) => {
      setCalledNumbers(called);
      setGameFinished(true);
      setWinnerInfo({ id: winnerId, name: winnerName });
      setShowModal(true);
      setPlayers((prev) => prev.map((p) => {
        const u = playerUpdates.find((x) => x.id === p.id);
        return u ? { ...p, bingoCount: u.bingoCount, hasWon: u.hasWon } : p;
      }));
    }));

   
    unsubs.push(on("player_won", ({ playerId, playerName, calledNumbers: called, playerUpdates }) => {
     
      showToast(`${playerName} got BINGO!`);
      setWinnerInfo({ id: playerId, name: playerName });
      setShowModal(true);
      if (Array.isArray(called)) setCalledNumbers(called);
      if (Array.isArray(playerUpdates)) {
        setPlayers((prev) => prev.map((p) => {
          const u = playerUpdates.find((x) => x.id === p.id);
          return u ? { ...p, bingoCount: u.bingoCount, hasWon: u.hasWon } : p;
        }));
      } else {
        setPlayers((prev) => prev.map((p) => p.id === playerId ? { ...p, hasWon: true } : p));
      }
    }));

    unsubs.push(on("game_ended", ({ message }) => {
      setGameFinished(true);
      showToast(message);
    }));

    unsubs.push(on("player_left", ({ leavingPlayerName, playerList, newHostId, nextTurnPlayerId, nextTurnPlayerName }) => {
      setPlayers(playerList);
      if (newHostId) setHostId(newHostId);
      setCurrentTurnId(nextTurnPlayerId ?? null);
      setCurrentTurnName(nextTurnPlayerName ?? "");
      showToast(`${leavingPlayerName ?? "Someone"} left`);
    }));

    unsubs.push(on("host_assigned", () => {
      if (myId) setHostId(myId);
      showToast("You're now the host");
    }));

    return () => unsubs.forEach((fn) => typeof fn === "function" && fn());
  }, [roomId, on, showToast, clientInfo?.playerId, myId]);

  
  const effectiveHostId = hostId ?? players[0]?.id;
  
  const isHost  = effectiveHostId === myId;
  const isMyTurn = currentTurnId === myId;

  
  const selectNumber = useCallback((number) => {
    if (!isMyTurn || !gameStarted || gameFinished) return;
    emit("select_number", { roomId, playerId: myId, number }, (res) => {
      if (res && !res.success) showToast(res.error ?? "Error");
    });
  }, [isMyTurn, gameStarted, gameFinished, emit, roomId, showToast, myId]);

  const startGame = useCallback(() => {
    emit("start_game", { roomId, playerId: myId }, (res) => {
      if (res && !res.success) showToast(res.error ?? "Cannot start");
    });
  }, [emit, roomId, showToast, myId]);

  const endGame = useCallback(() => emit("end_game", { roomId, playerId: myId }), [emit, roomId, myId]);

  const leaveRoom = useCallback(() => {
    emit("leave_room", { roomId, playerId: myId });
    sessionStorage.clear();
    router.replace("/");
  }, [emit, roomId, router, myId]);

  
  if (!myBoard.length) {
    return (
      <div className="min-h-dvh bg-canvas flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
          className="w-6 h-6 rounded-full border-2 border-accent-400 border-t-transparent"
        />
      </div>
    );
  }

  return (
    <>
      <Head><title>Bingo · {roomId}</title></Head>

      <div className="page-bg min-h-dvh flex flex-col">

        
        <AnimatePresence>
          {toast && (
            <motion.div
              key={toast}
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-d-raised border border-d-border2 text-d-text text-xs font-medium px-4 py-2 rounded-[20px] shadow-glass max-w-[260px] text-center pointer-events-none"
            >
              {toast}
            </motion.div>
          )}
        </AnimatePresence>

       
        {showModal && winnerInfo && (
          <WinnerModal
            winnerName={winnerInfo.name}
            isWinner={winnerInfo.id === myId}
            onClose={() => setShowModal(false)}
          />
        )}

       
        <div className="flex-1 flex flex-col lg:flex-row max-w-4xl mx-auto w-full gap-0 lg:gap-5 px-4 pt-4 pb-6 lg:px-6 lg:pt-6">

          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28 }}
            className="flex-1 flex flex-col gap-3 order-1"
          >
            {/* Room header */}
            <RoomInfo roomId={roomId ?? ""} playerCount={players.length} />

            {/* Greeting + status */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-base font-semibold text-d-text">
                  Hi, {myName} 👋
                </p>
                <p className="text-[12px] text-d-text2 mt-0.5">
                  {!gameStarted
                    ? "Waiting for host to start the game"
                    : gameFinished
                      ? "Game over"
                      : `${calledNumbers.length} / 25 numbers called`
                  }
                </p>
              </div>
              {/* Live dot */}
              <div className={[
                "flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-pill border",
                connected
                  ? "border-green-500/30 bg-green-500/10 text-green-400"
                  : "border-rose-500/30 bg-rose-500/10 text-rose-400",
              ].join(" ")}>
                <span className={["w-1.5 h-1.5 rounded-full", connected ? "bg-green-500 animate-pulse" : "bg-red-500"].join(" ")} />
                {connected ? "Live" : "Offline"}
              </div>
            </div>

            {/* Turn indicator */}
            {gameStarted && !gameFinished && (
              <TurnIndicator
                isMyTurn={isMyTurn}
                currentTurnPlayerName={currentTurnName}
                lastCalledNumber={lastCalled}
                callerName={callerName}
              />
            )}

            {/* My bingo progress â€” private to self */}
            {gameStarted && (
              <div className="bg-surface border border-border rounded-card px-4 py-3">
                <BingoProgress count={bingoCount} />
              </div>
            )}

            
            <div className="bg-surface border border-border rounded-card p-4 flex justify-center">
              <BingoBoard
                board={myBoard}
                markedNumbers={markedNumbers}
                lines={lines}
                isMyTurn={isMyTurn}
                gameStarted={gameStarted && !gameFinished}
                onSelectNumber={selectNumber}
              />
            </div>

            {/* Called numbers â€” mobile only (sidebar on desktop) */}
            {gameStarted && (
              <div className="lg:hidden glass-dark px-4 py-3">
                <CalledNumbers numbers={calledNumbers} />
              </div>
            )}

            {/* Controls â€” mobile only (sidebar on desktop) */}
            <div className="lg:hidden">
              <GameControls
                isHost={isHost}
                gameStarted={gameStarted}
                gameFinished={gameFinished}
                playerCount={players.length}
                onStart={startGame}
                onEnd={endGame}
                onLeave={leaveRoom}
              />
            </div>
          </motion.div>

          
          <motion.aside
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.28, delay: 0.06 }}
            className="hidden lg:flex flex-col gap-3 w-64 flex-shrink-0 order-2"
          >
            {/* Players */}
            <div className="glass p-4 space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-d-text3">Players</p>
              <PlayerStatus
                  players={players}
                  mySocketId={myId}
                  currentTurnPlayerId={currentTurnId}
                  hostId={effectiveHostId}
                />
            </div>

            {/* Called numbers */}
            {gameStarted && (
              <div className="bg-surface border border-border rounded-card px-4 py-3">
                <CalledNumbers numbers={calledNumbers} />
              </div>
            )}

            {/* Controls */}
            <GameControls
              isHost={isHost}
              gameStarted={gameStarted}
              gameFinished={gameFinished}
              playerCount={players.length}
              onStart={startGame}
              onEnd={endGame}
              onLeave={leaveRoom}
            />
          </motion.aside>

        </div>

       
        {players.length > 0 && (
          <div className="lg:hidden bg-d-surface border-t border-d-border px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-d-text3 mb-2">Players</p>
            <div className="flex gap-2 overflow-x-auto pb-0.5">
              {players.map((p) => {
                const isTurn = p.id === currentTurnId;
                const isMe   = p.id === myId;
                return (
                  <div
                    key={p.id}
                    className={[
                      "flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-[10px] border text-xs font-medium",
                      isMe    ? "bg-brand-500/[0.12] border-brand-500/25 text-d-text" : "glass-dark border-d-border text-d-text2",
                    ].join(" ")}
                  >
                    {isTurn && <span className="w-1.5 h-1.5 rounded-full bg-brand-400 flex-shrink-0" />}
                    {p.name}
                    {isMe && <span className="text-brand-400">(me)</span>}
                    {p.hasWon && <span className="text-gold-400">🏅</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
