import { loadRoom, saveRoom, pusher } from './_lib';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { roomId, playerId } = req.body || {};
  const room = await loadRoom(roomId);
  if (!room || room.hostId !== playerId) return res.status(200).json({ success: false });
  room.finished = true;
  await saveRoom(roomId, room);
  try { await pusher.trigger(`room-${roomId}`, 'game_ended', { message: 'Host ended the game.' }); } catch (e) {}
  res.status(200).json({ success: true });
}
