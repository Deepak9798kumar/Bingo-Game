import { v4 as uuidv4 } from 'uuid';
import { generateBoard } from '../../lib/gameLogic';
import { loadRoom, saveRoom, pusher } from './_lib';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { playerName, roomId } = req.body || {};
  const room = await loadRoom(roomId);
  if (!room) return res.status(200).json({ success: false, error: 'Room not found.' });
  
  if (room.started && !room.finished) return res.status(200).json({ success: false, error: 'Game already started.' });
  if (room.players.length >= 6) return res.status(200).json({ success: false, error: 'Room is full (max 6 players).' });

  
  const existingPlayer = room.players.find((p) => p.name === playerName);
  if (existingPlayer) {
    return res.status(200).json({ success: true, roomId, playerId: existingPlayer.id, board: existingPlayer.board });
  }

  
  const playerId = uuidv4();
  const newPlayer = { id: playerId, name: playerName, board: generateBoard(), markedNumbers: [], lines: [], bingoCount: 0, hasWon: false };
  room.players.push(newPlayer);
  await saveRoom(roomId, room);

  try { await pusher.trigger(`room-${roomId}`, 'player_joined', { playerList: room.players.map(p => ({ id: p.id, name: p.name, bingoCount: p.bingoCount, hasWon: p.hasWon })) }); } catch (e) {}

  res.status(200).json({ success: true, roomId, playerId, board: newPlayer.board });
}
