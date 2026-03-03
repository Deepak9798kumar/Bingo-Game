import { loadRoom, saveRoom, pusher } from './_lib';
import { detectLines } from '../../lib/gameLogic';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { roomId, playerId, number } = req.body || {};
  const room = await loadRoom(roomId);
  if (!room || !room.started || room.finished) return res.status(200).json({ success: false });

  const currentPlayer = room.players[room.currentTurnIndex];
  if (currentPlayer.id !== playerId) return res.status(200).json({ success: false, error: 'Not your turn.' });
  if (room.calledNumbers.includes(number)) return res.status(200).json({ success: false, error: 'Number already called.' });

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

  // advance turn
  room.currentTurnIndex = (room.currentTurnIndex + 1) % room.players.length;
  const nextPlayer = room.players[room.currentTurnIndex];

  // determine how many players have won so far
  const winnersCount = room.players.filter((p) => p.hasWon).length;

  // If this call created a winner, decide whether to finish the game or continue.
  // New behaviour: DO NOT end the game on the first bingo. Allow play to continue
  // until either (a) all but one player have won, or (b) the numbers are exhausted.
  if (winner) {
    const isFinal = winnersCount >= Math.max(0, room.players.length - 1) || room.calledNumbers.length >= 75;
    if (isFinal) {
      room.finished = true;
      room.winnerId = winner.id;
      room.winnerName = winner.name;
      try {
        await pusher.trigger(`room-${roomId}`, 'game_over', { winnerId: winner.id, winnerName: winner.name, calledNumbers: room.calledNumbers, playerUpdates });
      } catch (e) {}
    } else {
      // announce the number as usual (updates include hasWon for the player)
      try {
        await pusher.trigger(`room-${roomId}`, 'number_called', { number, calledNumbers: room.calledNumbers, callerName: currentPlayer.name, nextTurnPlayerId: nextPlayer.id, nextTurnPlayerName: nextPlayer.name, playerUpdates });
      } catch (e) {}
      // also notify the room that someone achieved bingo (clients can show a toast/indicator and sync state)
      try {
        await pusher.trigger(`room-${roomId}`, 'player_won', { playerId: winner.id, playerName: winner.name, calledNumbers: room.calledNumbers, playerUpdates });
      } catch (e) {}
    }
  } else {
    try { await pusher.trigger(`room-${roomId}`, 'number_called', { number, calledNumbers: room.calledNumbers, callerName: currentPlayer.name, nextTurnPlayerId: nextPlayer.id, nextTurnPlayerName: nextPlayer.name, playerUpdates }); } catch (e) {}
  }

  for (const player of room.players) {
    try { await pusher.trigger(`player-${player.id}`, 'board_update', { markedNumbers: player.markedNumbers, lines: player.lines, bingoCount: player.bingoCount }); } catch (e) {}
  }

  await saveRoom(roomId, room);
  res.status(200).json({ success: true });
}
