import { useEffect, useRef, useState, useCallback } from "react";
import Pusher from "pusher-js";

let globalPusher = null;

export function useSocket() {
  const [connected, setConnected] = useState(false);
  const pusherRef = useRef(null);
  const roomChannelRef = useRef(null);
  const playerChannelRef = useRef(null);
  const handlersRef = useRef({});
  const clientInfoRef = useRef({ roomId: null, playerId: null });
  const [clientState, setClientState] = useState({ roomId: null, playerId: null });

  useEffect(() => {
    if (!globalPusher) {
      globalPusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, { cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER });
    }
    pusherRef.current = globalPusher;
    setConnected(true);
  }, []);

  const subscribeChannels = useCallback((roomId, playerId) => {
    if (!pusherRef.current) return;
    
    if (roomChannelRef.current) { try { pusherRef.current.unsubscribe(`room-${roomChannelRef.current}`); } catch (e) {} }
    if (playerChannelRef.current) { try { pusherRef.current.unsubscribe(`player-${playerChannelRef.current}`); } catch (e) {} }

    roomChannelRef.current = roomId;
    playerChannelRef.current = playerId;
    clientInfoRef.current = { roomId, playerId };
    setClientState({ roomId, playerId });

    const roomCh = pusherRef.current.subscribe(`room-${roomId}`);
    const playerCh = pusherRef.current.subscribe(`player-${playerId}`);

 
    const handlers = handlersRef.current;
    Object.keys(handlers).forEach((evt) => {
      const set = handlers[evt];
      set.forEach((h) => {
        try { roomCh.bind(evt, h); } catch (e) {}
        try { playerCh.bind(evt, h); } catch (e) {}
      });
    });
  }, []);

  const emit = useCallback(async (event, data, cb) => {
    
    const route = `/api/${event}`;
    try {
      const res = await fetch(route, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
      const json = await res.json();
      if (json?.roomId && json?.playerId) subscribeChannels(json.roomId, json.playerId);
      if (cb) cb(json);
      return json;
    } catch (e) {
      if (cb) cb({ success: false, error: e.message });
      return { success: false, error: e.message };
    }
  }, [subscribeChannels]);

  const on = useCallback((event, handler) => {
    if (!handlersRef.current[event]) handlersRef.current[event] = new Set();
    handlersRef.current[event].add(handler);
    
    try { if (roomChannelRef.current) pusherRef.current.subscribe(`room-${roomChannelRef.current}`).bind(event, handler); } catch (e) {}
    try { if (playerChannelRef.current) pusherRef.current.subscribe(`player-${playerChannelRef.current}`).bind(event, handler); } catch (e) {}
    return () => { handlersRef.current[event]?.delete(handler); try { if (roomChannelRef.current) pusherRef.current.subscribe(`room-${roomChannelRef.current}`).unbind(event, handler); } catch (e) {} try { if (playerChannelRef.current) pusherRef.current.subscribe(`player-${playerChannelRef.current}`).unbind(event, handler); } catch (e) {} };
  }, []);

  const off = useCallback((event, handler) => {
    handlersRef.current[event]?.delete(handler);
    try { if (roomChannelRef.current) pusherRef.current.subscribe(`room-${roomChannelRef.current}`).unbind(event, handler); } catch (e) {}
    try { if (playerChannelRef.current) pusherRef.current.subscribe(`player-${playerChannelRef.current}`).unbind(event, handler); } catch (e) {}
  }, []);

  return { pusher: pusherRef.current, connected, emit, on, off, subscribeChannels, clientInfo: clientState };
}
