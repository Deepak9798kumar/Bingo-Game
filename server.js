const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { v4: uuidv4 } = require("uuid");
const Pusher = require("pusher");
const { Redis } = require("@upstash/redis");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

// ── In-memory game state ──────────────────────────────────────────────────────
const rooms = {}; 

function generateBoard() {
  const nums = Array.from({ length: 25 }, (_, i) => i + 1);
  for (let i = nums.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [nums[i], nums[j]] = [nums[j], nums[i]];
  }
  return nums; // flat array [25 numbers]
}

function detectLines(marked, board) {
  // marked = Set of numbers that have been called
  // board  = flat 25-element array
  const grid = board.map((n) => marked.has(n));
  const lines = [];

  // rows
  for (let r = 0; r < 5; r++) {
    if ([0, 1, 2, 3, 4].every((c) => grid[r * 5 + c])) lines.push(`row-${r}`);
  }
  // cols
  for (let c = 0; c < 5; c++) {
    if ([0, 1, 2, 3, 4].every((r) => grid[r * 5 + c])) lines.push(`col-${c}`);
  }
  // diagonals
  if ([0, 6, 12, 18, 24].every((i) => grid[i])) lines.push("diag-tl");
  if ([4, 8, 12, 16, 20].every((i) => grid[i])) lines.push("diag-tr");

  return lines; // array of unique line keys
}

app.prepare().then(() => {
  // Pusher server client
  const pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID,
    key: process.env.PUSHER_KEY,
    secret: process.env.PUSHER_SECRET,
    cluster: process.env.PUSHER_CLUSTER,
    useTLS: true,
  });

  // Upstash Redis client
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  const httpServer = createServer(async (req, res) => {
    const parsedUrl = parse(req.url, true);

    // Let Next handle all page requests
    if (!parsedUrl.pathname.startsWith('/api')) {
      return handle(req, res, parsedUrl);
    }

    // Simple CORS & JSON response helper
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.end();

    // collect body
    let body = '';
    for await (const chunk of req) body += chunk;
    let data = {};
    try { if (body) data = JSON.parse(body); } catch (e) { data = {}; }

    const pathname = parsedUrl.pathname;

    // helpers to persist/fetch
    const saveRoom = async (room) => {
      rooms[room.id] = room;
      try { await redis.set(`rooms:${room.id}`, JSON.stringify(room)); } catch (e) {}
    };
    const delRoom = async (roomId) => {
      delete rooms[roomId];
      try { await redis.del(`rooms:${roomId}`); } catch (e) {}
    };
    const loadRoom = async (roomId) => {
      if (rooms[roomId]) return rooms[roomId];
      try {
        const v = await redis.get(`rooms:${room.id || roomId}`);
        if (v) { rooms[roomId] = JSON.parse(v); return rooms[roomId]; }
      } catch (e) {}
      return rooms[roomId];
    };

    // ROUTES
    if (pathname === '/api/create_room' && req.method === 'POST') {
      const { playerName } = data;
      const roomId = uuidv4().slice(0, 6).toUpperCase();
      const playerId = uuidv4();
      const room = {
        id: roomId,
        hostId: playerId,
        players: [{ id: playerId, name: playerName, board: generateBoard(), markedNumbers: [], lines: [], bingoCount: 0, hasWon: false }],
        calledNumbers: [],
        currentTurnIndex: 0,
        started: false,
        finished: false,
        winnerId: null,
        winnerName: null,
      };
      await saveRoom(room);
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: true, roomId, playerId, board: room.players[0].board }));
      return;
    }

    if (pathname === '/api/join_room' && req.method === 'POST') {
      const { playerName, roomId } = data;
      const room = await loadRoom(roomId);
      if (!room) return res.end(JSON.stringify({ success: false, error: 'Room not found.' }));
      if (room.started) return res.end(JSON.stringify({ success: false, error: 'Game already started.' }));
      if (room.players.length >= 6) return res.end(JSON.stringify({ success: false, error: 'Room is full (max 6 players).' }));
      if (room.players.find((p) => p.name === playerName)) return res.end(JSON.stringify({ success: false, error: 'Name already taken in this room.' }));

      const playerId = uuidv4();
      const newPlayer = { id: playerId, name: playerName, board: generateBoard(), markedNumbers: [], lines: [], bingoCount: 0, hasWon: false };
      room.players.push(newPlayer);
      await saveRoom(room);

      // notify room
      try { await pusher.trigger(`room-${roomId}`, 'player_joined', { playerList: room.players.map(p => ({ id: p.id, name: p.name, bingoCount: p.bingoCount, hasWon: p.hasWon })) }); } catch (e) {}

      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: true, roomId, playerId, board: newPlayer.board }));
      return;
    }

    if (pathname === '/api/start_game' && req.method === 'POST') {
      const { roomId, playerId } = data;
      const room = await loadRoom(roomId);
      if (!room) return res.end(JSON.stringify({ success: false, error: 'Room not found.' }));
      if (room.hostId !== playerId) return res.end(JSON.stringify({ success: false, error: 'Only host can start the game.' }));
      if (room.players.length < 2) return res.end(JSON.stringify({ success: false, error: 'Need at least 2 players.' }));

      room.started = true;
      room.currentTurnIndex = 0;
      await saveRoom(room);
      try { await pusher.trigger(`room-${roomId}`, 'game_started', { currentTurnPlayerId: room.players[0].id, currentTurnPlayerName: room.players[0].name, playerList: room.players.map(p => ({ id: p.id, name: p.name, bingoCount: p.bingoCount, hasWon: p.hasWon })) }); } catch (e) {}
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: true }));
      return;
    }

    if (pathname === '/api/select_number' && req.method === 'POST') {
      const { roomId, playerId, number } = data;
      const room = await loadRoom(roomId);
      if (!room || !room.started || room.finished) return res.end(JSON.stringify({ success: false }));

      const currentPlayer = room.players[room.currentTurnIndex];
      if (currentPlayer.id !== playerId) return res.end(JSON.stringify({ success: false, error: 'Not your turn.' }));
      if (room.calledNumbers.includes(number)) return res.end(JSON.stringify({ success: false, error: 'Number already called.' }));

      room.calledNumbers.push(number);

      const playerUpdates = [];
      let winner = null;
      for (const player of room.players) {
        if (!player.markedNumbers.includes(number)) player.markedNumbers.push(number);
        const newLines = detectLines(new Set(player.markedNumbers), player.board);
        player.lines = newLines;
        player.bingoCount = newLines.length;
        if (player.bingoCount >= 5 && !player.hasWon) { player.hasWon = true; if (!winner) winner = player; }
        playerUpdates.push({ id: player.id, bingoCount: player.bingoCount, hasWon: player.hasWon });
      }

      room.currentTurnIndex = (room.currentTurnIndex + 1) % room.players.length;
      const nextPlayer = room.players[room.currentTurnIndex];

      if (winner) {
        room.finished = true;
        room.winnerId = winner.id;
        room.winnerName = winner.name;
        try { await pusher.trigger(`room-${roomId}`, 'game_over', { winnerId: winner.id, winnerName: winner.name, calledNumbers: room.calledNumbers, playerUpdates }); } catch (e) {}
      } else {
        try { await pusher.trigger(`room-${roomId}`, 'number_called', { number, calledNumbers: room.calledNumbers, callerName: currentPlayer.name, nextTurnPlayerId: nextPlayer.id, nextTurnPlayerName: nextPlayer.name, playerUpdates }); } catch (e) {}
      }

      // personal board updates
      for (const player of room.players) {
        try { await pusher.trigger(`player-${player.id}`, 'board_update', { markedNumbers: player.markedNumbers, lines: player.lines, bingoCount: player.bingoCount }); } catch (e) {}
      }

      await saveRoom(room);
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: true }));
      return;
    }

    if (pathname === '/api/end_game' && req.method === 'POST') {
      const { roomId, playerId } = data;
      const room = await loadRoom(roomId);
      if (!room || room.hostId !== playerId) return res.end(JSON.stringify({ success: false }));
      room.finished = true;
      await saveRoom(room);
      try { await pusher.trigger(`room-${roomId}`, 'game_ended', { message: 'Host ended the game.' }); } catch (e) {}
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: true }));
      return;
    }

    if (pathname === '/api/leave_room' && req.method === 'POST') {
      const { roomId, playerId } = data;
      const room = await loadRoom(roomId);
      if (!room) return res.end(JSON.stringify({ success: false }));

      const leavingPlayer = room.players.find((p) => p.id === playerId);
      room.players = room.players.filter((p) => p.id !== playerId);

      if (room.players.length === 0) { await delRoom(roomId); res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ success: true })); return; }

      if (room.hostId === playerId) { room.hostId = room.players[0].id; try { await pusher.trigger(`player-${room.hostId}`, 'host_assigned', {}); } catch (e) {} }
      room.currentTurnIndex = room.currentTurnIndex % room.players.length;
      const nextPlayer = room.players[room.currentTurnIndex];

      try { await pusher.trigger(`room-${roomId}`, 'player_left', { leavingPlayerName: leavingPlayer?.name, playerList: room.players.map(p => ({ id: p.id, name: p.name, bingoCount: p.bingoCount, hasWon: p.hasWon })), newHostId: room.hostId, nextTurnPlayerId: nextPlayer?.id, nextTurnPlayerName: nextPlayer?.name }); } catch (e) {}

      await saveRoom(room);
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ success: true }));
      return;
    }

    // unknown API
    res.statusCode = 404;
    res.end(JSON.stringify({ error: 'Not found' }));
  });

  function handleLeave(socket, roomId, io) {
    const room = rooms[roomId];
    if (!room) return;

    const leavingPlayer = room.players.find((p) => p.id === socket.id);
    room.players = room.players.filter((p) => p.id !== socket.id);
    socket.leave(roomId);

    if (room.players.length === 0) {
      delete rooms[roomId];
      console.log(`[room] ${roomId} deleted (empty)`);
      return;
    }

    // If host left, assign new host
    if (room.hostId === socket.id) {
      room.hostId = room.players[0].id;
      io.to(room.hostId).emit("host_assigned");
    }

    // Fix currentTurnIndex
    room.currentTurnIndex = room.currentTurnIndex % room.players.length;

    const nextPlayer = room.players[room.currentTurnIndex];

    io.to(roomId).emit("player_left", {
      leavingPlayerName: leavingPlayer?.name,
      playerList: room.players.map((p) => ({
        id: p.id,
        name: p.name,
        bingoCount: p.bingoCount,
        hasWon: p.hasWon,
      })),
      newHostId: room.hostId,
      nextTurnPlayerId: nextPlayer?.id,
      nextTurnPlayerName: nextPlayer?.name,
    });
  }

  const PORT = process.env.PORT || 3000;
  httpServer.listen(PORT, () => {
    console.log(`> Ready on http://localhost:${PORT}`);
  });
});
