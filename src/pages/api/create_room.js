import { v4 as uuidv4 } from 'uuid';
import { generateBoard } from '../../lib/gameLogic';
import { saveRoom, pusher } from './_lib';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { playerName } = req.body || {};
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

  await saveRoom(roomId, room);
  res.status(200).json({ success: true, roomId, playerId, board: room.players[0].board });
}
