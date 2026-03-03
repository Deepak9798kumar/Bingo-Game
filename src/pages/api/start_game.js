import { loadRoom, saveRoom, pusher } from './_lib';
import { generateBoard } from '../../lib/gameLogic';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { roomId, playerId } = req.body || {};
  const room = await loadRoom(roomId);
  if (!room) return res.status(200).json({ success: false, error: 'Room not found.' });
  if (room.hostId !== playerId) return res.status(200).json({ success: false, error: 'Only host can start the game.' });
  if (room.players.length < 2) return res.status(200).json({ success: false, error: 'Need at least 2 players.' });
  // Reset room state for a fresh game so the same room can be reused.
  room.started = true;
  room.finished = false;
  room.currentTurnIndex = 0;
  room.calledNumbers = [];
  room.winnerId = null;
  room.winnerName = null;

  // Reset per-player state and generate fresh boards
  room.players = room.players.map((p) => ({
    ...p,
    board: generateBoard(),
    markedNumbers: [],
    lines: [],
    bingoCount: 0,
    hasWon: false,
  }));

  await saveRoom(roomId, room);

  try {
    await pusher.trigger(
      `room-${roomId}`,
      'game_started',
      {
        currentTurnPlayerId: room.players[0].id,
        currentTurnPlayerName: room.players[0].name,
        playerList: room.players.map((p) => ({ id: p.id, name: p.name, bingoCount: p.bingoCount, hasWon: p.hasWon })),
      }
    );
  } catch (e) {}

  res.status(200).json({ success: true });
}
