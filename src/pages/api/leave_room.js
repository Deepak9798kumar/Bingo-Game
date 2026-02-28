import { loadRoom, saveRoom, delRoom, pusher } from './_lib';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { roomId, playerId } = req.body || {};
  const room = await loadRoom(roomId);
  if (!room) return res.status(200).json({ success: false });

  const leavingPlayer = room.players.find((p) => p.id === playerId);
  room.players = room.players.filter((p) => p.id !== playerId);

  if (room.players.length === 0) { await delRoom(roomId); return res.status(200).json({ success: true }); }

  if (room.hostId === playerId) { room.hostId = room.players[0].id; try { await pusher.trigger(`player-${room.hostId}`, 'host_assigned', {}); } catch (e) {} }
  room.currentTurnIndex = room.currentTurnIndex % room.players.length;
  const nextPlayer = room.players[room.currentTurnIndex];

  try { await pusher.trigger(`room-${roomId}`, 'player_left', { leavingPlayerName: leavingPlayer?.name, playerList: room.players.map(p => ({ id: p.id, name: p.name, bingoCount: p.bingoCount, hasWon: p.hasWon })), newHostId: room.hostId, nextTurnPlayerId: nextPlayer?.id, nextTurnPlayerName: nextPlayer?.name }); } catch (e) {}

  await saveRoom(roomId, room);
  res.status(200).json({ success: true });
}
